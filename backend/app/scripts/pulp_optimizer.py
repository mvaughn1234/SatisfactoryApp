import json
from collections import defaultdict
from decimal import Decimal

import numpy as np
import pulp
from numpy import float128

from app.services.recipe_service import RecipeService


def optimizer(recipes, targets):
    unpackage_recipes = [
        118,
        128,
        159,
        197,
        198,
        199,
        200,
        201,
        219,
        265,
        277,
        293,
    ]
    # Assume RecipeService.get_component_recipes_details() provides structured recipe data
    known_recipes = [int(key) for key, value in recipes.items() if "known" in value and value["known"] is True]
    excluded_recipes = [int(key) for key, value in recipes.items() if "excluded" in value and value["excluded"] is True]
    excluded_recipes = [*excluded_recipes, *unpackage_recipes]
    recipes_overridden_by_preference = [int(recipe_id) for recipe_id, config in recipes.items() if "preferred in config"
                            and config["preferred"] != recipe_id]

    recipes_detail = RecipeService.get_component_recipes_details()
    pruned_recipes = [
        recipe for recipe in recipes_detail
        if recipe['id'] in known_recipes
           and recipe['id'] not in excluded_recipes
           and recipe['id'] not in recipes_overridden_by_preference
    ]


    # Define raw resources and their global limits.
    # You can adjust these to reflect the actual availability in your world.
    raw_resource_limits = {
        155: 92100,  # Iron Ore
        156: 42300,  # Coal
        157: 1e9,  # Water (just a large number; effectively abundant)
        158: 12000,  # Nitrogen Gas
        159: 10800,  # Sulfur *
        160: 10200,  # Sam Ore
        161: 12300,  # Bauxite *
        162: 15000,  # Caterium Ore
        163: 36900,  # Copper Ore
        164: 13500,  # Raw Quartz *
        165: 69900,  # Limestone *
        166: 2100,  # Uranium
        167: 12600,  # Crude Oil
    }

    raw_resources = set(raw_resource_limits.keys())

    # Calculate cost based on availability: cost = 1 / global_limit.
    # More abundant = lower cost, more scarce = higher cost.
    resource_costs = {rid: (1.0 / limit) for rid, limit in raw_resource_limits.items()}

    # Extract all item IDs involved
    items = list({
        item['id']
        for recipe in pruned_recipes
        for item in (recipe['ingredients'] + recipe['products'])
    })

    item_to_index = {item_id: idx for idx, item_id in enumerate(items)}
    recipe_ids = [recipe['id'] for recipe in pruned_recipes]
    recipe_to_index = {recipe_id: idx for idx, recipe_id in enumerate(recipe_ids)}

    # Matrix rows: items, columns: recipes
    # matrix[i, j] > 0 means recipe j produces item i
    # matrix[i, j] < 0 means recipe j consumes item i
    matrix = np.zeros((len(items), len(recipe_ids)))

    recipes_struct = {}
    for recipe in pruned_recipes:
        r_idx = recipe_to_index[recipe['id']]
        duration = Decimal(recipe['manufactoring_duration'])  # Incorporate the recipe duration
        runs_per_minute = Decimal(Decimal(60.0) / duration)

        recipes_struct[recipe['id']] = {
            "inputs": {ing['id']: int(ing['amount']) for ing in recipe['ingredients']},
            "outputs": {prod['id']: int(prod['amount']) for prod in recipe['products']}
        }

        for prod in recipe['products']:
            i_idx = item_to_index[prod['id']]
            matrix[i_idx, r_idx] += float128(prod['amount'] * runs_per_minute)
        for ing in recipe['ingredients']:
            i_idx = item_to_index[ing['id']]
            matrix[i_idx, r_idx] -= float128(ing['amount'] * runs_per_minute)

    # Initialize LP problem
    # We minimize cost of scarce resource usage
    prob = pulp.LpProblem("Satisfactory_Production_Optimizer", pulp.LpMinimize)

    # Variables: production scale for each recipe
    recipe_vars = {r_id: pulp.LpVariable(f"scale_{r_id}", lowBound=0) for r_id in recipe_ids}

    # Parse target outputs
    target_outputs = {}
    for target in targets:
        # target['product']['id'] and target['rate'] are assumed keys
        target_outputs[target['product']['id']] = target['rate']

    # Target output constraints
    for item_id, required_scale in target_outputs.items():
        i_idx = item_to_index[item_id]
        prob += (
            pulp.lpSum(matrix[i_idx, recipe_to_index[rid]] * recipe_vars[rid] for rid in recipe_ids) >= required_scale,
            f"Target_output_{item_id}"
        )

    # Flow constraints for intermediate items: They should not be net negative.
    # This means the production of these items is at least 0.
    # If you find you need stricter constraints (like exact balances), you could do:
    # == 0 for items that should have no net surplus/deficit.
    for item_id in items:
        if item_id not in target_outputs and item_id not in raw_resources:
            i_idx = item_to_index[item_id]
            prob += (
                pulp.lpSum(matrix[i_idx, recipe_to_index[rid]] * recipe_vars[rid] for rid in recipe_ids) >= 0,
                f"Flow_balance_{item_id}"
            )

    # Raw resource constraints: Cannot exceed the limit.
    # Remember that matrix[i, j] is negative for inputs, so summation is negative when consuming.
    # We want sum(...) >= -limit, which ensures consumption <= limit.
    for raw_id, max_amount in raw_resource_limits.items():
        i_idx = item_to_index[raw_id]
        prob += (
            pulp.lpSum(matrix[i_idx, recipe_to_index[rid]] * recipe_vars[rid] for rid in recipe_ids) >= -max_amount,
            f"Raw_resource_limit_{raw_id}"
        )

    handling_fee = 1e-6  # example small fee

    # Objective: Minimize weighted resource usage.
    # We sum over all raw resources the consumed amount * resource_cost.
    # matrix[i,j]<0 means consumption of that resource.
    # Multiply by -1 to get positive consumption.
    # Then multiply by resource_costs to weight scarcity.
    # The solver will try to minimize the total cost, preferring cheap (abundant) resources over expensive (scarce) ones.
    prob += pulp.lpSum(
        (-matrix[item_to_index[raw_id], recipe_to_index[rid]] * recipe_vars[rid] * resource_costs[raw_id])
        for raw_id in raw_resources
        for rid in recipe_ids
        if matrix[item_to_index[raw_id], recipe_to_index[rid]] < 0
    ) + pulp.lpSum(handling_fee * recipe_vars[rid] for rid in recipe_ids), "Minimize_Total_Cost"

    # Solve
    prob.solve()
    # prob.solve(pulp.PULP_CBC_CMD(msg=True, gapRel=1e-9))

    # Build result
    production_line = {}
    raw_resource_usage = defaultdict(float)
    r_ids = [r_id for r_id, var in recipe_vars.items()]

    significance = 1e-6
    significant_r_ids = [r_id for r_id, var in recipe_vars.items() if var.value() and var.value() > significance]
    recipe_details = RecipeService.get_recipe_by_id_detail(significant_r_ids)

    for r_id, var in recipe_vars.items():
        val = var.value()
        if val and val > significance:
            scale = val

            recipe_data = next((recipe for recipe in recipe_details if recipe["id"] == r_id), None)
            print("got recipe data structured ", recipe_data['display_name'])

            production_line[r_id] = {"recipe_data": recipe_data, "scale": scale}

    # Calculate Raw Resource Usage
    raw_resource_usage = defaultdict(float)

    for iid in raw_resources:
        i_idx = item_to_index[iid]
        net_flow = 0.0
        for r_id, var in recipe_vars.items():
            val = var.value()
            if val and val > significance:
                r_idx = recipe_to_index[r_id]
                # matrix[i_idx, r_idx] is the per-machine net rate (positive = produce, negative = consume)
                # Multiply by 'val' (number of machines) to get the total net flow for this item from this recipe.
                net_flow += matrix[i_idx, r_idx] * val

        # If net_flow is negative, we have a net consumption of that resource from outside:
        if net_flow < -1e-6:
            # Convert negative to positive quantity, as we list the external requirement
            raw_resource_usage[iid] = -net_flow
        # If net_flow >= 0, it means we're balanced or producing a surplus. We don't need external supply of that resource.

    print("before compiling result")
    result = {
        "target_output": [{"item_id": iid, "amount": rt} for iid, rt in target_outputs.items()],
        "production_line": production_line,
        "raw_resource_usage": [{"item_id": iid, "total_quantity": round(q, 3)} for iid, q in raw_resource_usage.items() if
                               q > 1e-6]
    }

    print("after compiling result")
    # result_json = json.dumps(result, indent=4)

    return result
