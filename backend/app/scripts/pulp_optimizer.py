import pulp
import numpy as np
import json

from collections import defaultdict

from app.services.recipe_service import RecipeService


def optimizer():
    # Assume RecipeService.get_component_recipes_details() provides structured recipe data
    recipes_detail = RecipeService.get_component_recipes_details()

    # Define raw resources available and their limits
    raw_resource_limits = {
        155: 92100, # Iron Ore
        156: 42300, # Coal
        157: 9007199254740991, # Water
        158: 12000, # Nitrogen Gas
        159: 10800, # Sulfur
        160: 10200, # Sam Ore
        161: 12300, # Bauxite
        162: 15000, # Caterium Ore
        163: 36900, # Copper Ore
        164: 13500, # Raw Quartz
        165: 69900, # Limestone
        166: 2100, # Uranium
        167: 12600, # Cure Oil
    }
    raw_resources = set(raw_resource_limits.keys())

    # Parse recipes into structured dictionaries for items and recipes
    items = list({item['id'] for recipe in recipes_detail for item in recipe['ingredients']} |
                 {item['id'] for recipe in recipes_detail for item in recipe['products']})
    item_to_index = {item_id: idx for idx, item_id in enumerate(items)}

    recipe_ids = [recipe['id'] for recipe in recipes_detail]
    recipe_to_index = {recipe_id: idx for idx, recipe_id in enumerate(recipe_ids)}

    # Initialize a matrix with rows for items and columns for recipes
    matrix = np.zeros((len(items), len(recipe_ids)))

    # Populate the matrix with input (negative) and output (positive) values
    recipes = {}
    for recipe in recipes_detail:
        recipe_idx = recipe_to_index[recipe['id']]
        recipes[recipe['id']] = {
            "inputs": {item['id']: float(item['amount']) for item in recipe['ingredients']},
            "outputs": {item['id']: float(item['amount']) for item in recipe['products']}
        }
        for output in recipe['products']:
            item_idx = item_to_index[output['id']]
            matrix[item_idx, recipe_idx] += output['amount']
        for input_item in recipe['ingredients']:
            item_idx = item_to_index[input_item['id']]
            matrix[item_idx, recipe_idx] -= input_item['amount']

    # Initialize the linear programming problem
    prob = pulp.LpProblem("Satisfactory_Production_Optimizer", pulp.LpMinimize)

    # Define variables for each recipe's rate
    recipe_vars = {recipe_id: pulp.LpVariable(f"rate_{recipe_id}", lowBound=0) for recipe_id in recipe_ids}

    # Define the target output, e.g., 10 units of item 33 per minute
    target_outputs = {21: 100, 22: 100}
    for item_id, required_rate in target_outputs.items():
        item_idx = item_to_index[item_id]
        prob += pulp.lpSum(matrix[item_idx, recipe_to_index[recipe_id]] * recipe_vars[recipe_id]
                           for recipe_id in recipe_ids) >= required_rate, f"Target_output_{item_id}"

    # Flow constraints to balance intermediate items
    for item_id in items:
        if item_id not in target_outputs and item_id not in raw_resources:
            item_idx = item_to_index[item_id]
            prob += pulp.lpSum(matrix[item_idx, recipe_to_index[recipe_id]] * recipe_vars[recipe_id]
                               for recipe_id in recipe_ids) >= 0, f"Flow_balance_{item_id}"

    # Raw resource constraints
    for raw_id, max_amount in raw_resource_limits.items():
        item_idx = item_to_index[raw_id]
        prob += pulp.lpSum(matrix[item_idx, recipe_to_index[recipe_id]] * recipe_vars[recipe_id]
                           for recipe_id in recipe_ids) >= -max_amount, f"Raw_resource_limit_{raw_id}"

    # Objective: Minimize raw resource usage
    prob += pulp.lpSum(
        -matrix[item_to_index[raw_id], recipe_to_index[recipe_id]] * recipe_vars[recipe_id]
        for raw_id in raw_resources for recipe_id in recipe_ids if
        matrix[item_to_index[raw_id], recipe_to_index[recipe_id]] < 0
    )

    # Solve the problem
    prob.solve()

    # Collect the production line details for the JSON output
    production_line = []
    raw_resource_usage = defaultdict(float)

    for recipe_id, var in recipe_vars.items():
        if var.value() > 0:  # Only include recipes with non-zero rates
            rate = var.value()
            recipe_data = {
                "recipe_id": recipe_id,
                "rate": rate,
                "outputs": [{"item_id": output_id, "quantity": recipes[recipe_id]["outputs"][output_id] * rate}
                            for output_id in recipes[recipe_id]["outputs"]],
                "inputs": [{"item_id": input_id, "quantity": recipes[recipe_id]["inputs"][input_id] * rate}
                           for input_id in recipes[recipe_id]["inputs"]]
            }
            production_line.append(recipe_data)

            # Track raw resource usage
            for input_id, quantity in recipes[recipe_id]["inputs"].items():
                if input_id in raw_resources:
                    raw_resource_usage[input_id] += quantity * rate

    # Build the JSON object
    result = {
        "target_output": [{"item_id": item_id, "rate": rate} for item_id, rate in target_outputs.items()],
        "production_line": production_line,
        "raw_resource_usage": [{"item_id": item_id, "total_quantity": quantity} for item_id, quantity in
                               raw_resource_usage.items()]
    }

    # Convert to JSON string (or directly return the dictionary if needed)
    result_json = json.dumps(result, indent=4)
    print(result_json)

    return result  # Or return result_json if a JSON string is preferred
