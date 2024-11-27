"""
./app/services/recipe_service.py
"""
from collections import defaultdict

from sqlalchemy.orm import aliased

from app.models.base import SessionLocal
from app.models.building_models import Building
from app.models.item_models import Item, Component
from app.models.recipe_models import Recipe, RecipeInputs, RecipeOutputs, RecipeCompatibleBuildings
from app.utils import get_session  # Assuming you save the context manager in session_manager.py


class RecipeService:
    @staticmethod
    def get_recipe_inputs(session: SessionLocal, recipe_ids: [int]) -> dict:
        # Gather related inputs
        inputs = session.query(RecipeInputs.recipe_id, Item, RecipeInputs.input_quantity).join(Item).filter(
            RecipeInputs.recipe_id.in_(recipe_ids)).all()

        # Create a dictionary where the key is the recipe id and the value is a list of ingredient Items
        recipes_to_ingredients = defaultdict(list)

        # Organize the results: group the ingredients by their producing recipe
        for recipe_id, input_item, amount in inputs:
            # Call the to_dict() method on each ingredient item and store in the dictionary
            input_item_summary = input_item.to_dict_summary()
            input_item_summary['amount'] = amount
            recipes_to_ingredients[recipe_id].append(input_item_summary)

        return recipes_to_ingredients

    @staticmethod
    def get_recipe_outputs(session: SessionLocal, recipe_ids: [int]) -> dict:
        # Gather related outputs
        outputs = session.query(RecipeOutputs.recipe_id, Item, RecipeOutputs.output_quantity).join(Item).filter(
            RecipeOutputs.recipe_id.in_(recipe_ids)).all()

        # Create a dictionary where the key is the recipe id and the value is a list of product Items
        recipes_to_products = defaultdict(list)

        # Organize the results: group the products by their producing recipe
        for recipe_id, output_item, amount in outputs:
            # Call the to_dict() method on each ingredient item and store in the dictionary
            output_item_summary = output_item.to_dict_summary()
            output_item_summary['amount'] = amount
            recipes_to_products[recipe_id].append(output_item_summary)

        return recipes_to_products

    @staticmethod
    def get_recipe_buildings(session: SessionLocal, recipe_ids: [int]) -> dict:
        # Perform a LEFT OUTER JOIN to handle cases where building_id is NULL
        producing_building = aliased(Building)
        buildings = (
            session.query(RecipeCompatibleBuildings.recipe_id, producing_building)
            .outerjoin(producing_building,
                       RecipeCompatibleBuildings.building_id == producing_building.id)  # LEFT OUTER JOIN
            .filter(RecipeCompatibleBuildings.recipe_id.in_(recipe_ids))
            .order_by(RecipeCompatibleBuildings.recipe_id)
            .all()
        )
        # Create a dictionary where the key is the recipe_id and the value is a list of compatible Buildings
        recipes_to_buildings = {}

        # Organize the results: group the buildings by their associated recipe
        for recipe_id, building in buildings:
            # Check if building is None (i.e., building_id was NULL)
            if building:
                recipes_to_buildings[recipe_id] = (building.to_dict_summary())
            else:
                recipes_to_buildings[recipe_id] = None

        return recipes_to_buildings

    @staticmethod
    def get_all_recipes_summary():
        with get_session() as session:
            all_recipes = session.query(Recipe).all()
            print("test")
            if not all_recipes:
                print("test2")
                return None

            print("test3")
            recipe_ids = [recipe.id for recipe in all_recipes]

            all_produced_in = RecipeService.get_recipe_buildings(session, recipe_ids)

            all_recipes_summary = [recipe.to_dict_summary() for recipe in all_recipes]
            all_recipes_summary_updated = []

            for recipe in all_recipes_summary:
                recipe_updated = recipe
                if recipe['id'] in all_produced_in.keys():
                    recipe_updated['produced_in'] = all_produced_in[recipe['id']]

                all_recipes_summary_updated.append(recipe_updated)

            return all_recipes_summary_updated

    @staticmethod
    def get_all_recipes_detail():
        with get_session() as session:
            all_recipes = session.query(Recipe).all()

            if not all_recipes:
                return None

            recipe_ids = [recipe.id for recipe in all_recipes]

            all_ingredients = RecipeService.get_recipe_inputs(session, recipe_ids)
            all_products = RecipeService.get_recipe_outputs(session, recipe_ids)
            all_produced_in = RecipeService.get_recipe_buildings(session, recipe_ids)

            all_recipes_details = [recipe.to_dict_detail() for recipe in all_recipes]
            all_recipes_details_updated = []
            for recipe in all_recipes_details:
                recipe_id = recipe['id']
                ingredients = all_ingredients[recipe_id] if recipe_id in all_ingredients else []
                products = all_products[recipe_id] if recipe_id in all_products else []
                produced_in = all_produced_in[recipe_id] if recipe_id in all_produced_in else []

                recipe_details_update = {
                    'ingredients': ingredients,
                    'products': products,
                    'produced_in': produced_in,
                }

                all_recipes_details_updated.append({**recipe, **recipe_details_update})

            return all_recipes_details_updated

    @staticmethod
    def get_recipe_by_id_detail(recipe_id):
        with get_session() as session:
            recipe = session.query(Recipe).filter(Recipe.id == recipe_id).first()

            if not recipe:
                return None

            ingredients = RecipeService.get_recipe_inputs(session, [recipe.id])
            products = RecipeService.get_recipe_outputs(session, [recipe.id])
            produced_in = RecipeService.get_recipe_buildings(session, [recipe.id])

            ingredients = ingredients[recipe.id] if recipe.id in ingredients else []
            products = products[recipe.id] if recipe.id in products else []
            produced_in = produced_in[recipe.id] if recipe.id in produced_in else []

            recipe_to_return = recipe.to_dict_detail()

            recipe_update_details = {
                'ingredients': ingredients,
                'products': products,
                'produced_in': produced_in,
            }

            return {**recipe_to_return, **recipe_update_details}

    @staticmethod
    def get_recipe_by_id_summary(recipe_id):
        with get_session() as session:
            recipe = session.query(Recipe).filter(Recipe.id == recipe_id).first()

            if not recipe:
                return None

            recipe_ids = [recipe.id]
            producing_building = aliased(Building)
            buildings = (
                session.query(RecipeCompatibleBuildings.recipe_id, producing_building)
                .outerjoin(producing_building,
                           RecipeCompatibleBuildings.building_id == producing_building.id)  # LEFT OUTER JOIN
                .filter(RecipeCompatibleBuildings.recipe_id.in_(recipe_ids))
                .order_by(RecipeCompatibleBuildings.recipe_id)
                .all()
            )
            produced_in = {}
            for recipe_id, building in buildings:
                if building:
                    produced_in[recipe_id] = (building.to_dict_summary())
                else:
                    produced_in[recipe_id] = None

            recipe_to_return = recipe.to_dict_summary()
            # produced_in = RecipeService.get_recipe_buildings(session, [recipe.id])
            if produced_in:
                recipe_to_return['produced_in'] = produced_in[recipe.id]
            else:
                recipe_to_return['produced_in'] = None
            return recipe_to_return

    @staticmethod
    def get_recipes_by_building(building_id):
        with get_session() as session:
            building = session.query(Building).filter(Building.id == building_id).first()

            # print(f"Building: {building}")
            # return [{"test": "test"}]

            if not building:
                return [{'message': 'Building does not exist.'}]

            recipe_compatible_buildings = session.query(RecipeCompatibleBuildings).filter(
                RecipeCompatibleBuildings.building_id == building_id).all()

            if not recipe_compatible_buildings:
                return [{"message": f"no recipes in {building.display_name}"}]

            recipes_to_return = []

            for recipe_compatible_building in recipe_compatible_buildings:
                recipe_item = RecipeService.get_recipe_by_id_detail(recipe_compatible_building.recipe_id)
                if recipe_item:
                    recipes_to_return.append(recipe_item)

            return recipes_to_return

    @staticmethod
    def get_component_recipes_ids():
        with get_session() as session:
            components = (
                session.query(Component, Item, Recipe)
                .join(Item, Item.id == Component.item_id)
                .join(Recipe, Recipe.id == Component.recipe_id)
            ).all()

            recipe_ids_to_return = []

            for component,_,_ in components:
                if component.recipe_id not in recipe_ids_to_return:
                    recipe_ids_to_return.append(component.recipe_id)

            recipe_ids_to_return.sort()

            return recipe_ids_to_return

    @staticmethod
    def get_component_recipes_details():
        with get_session() as session:
            components = (
                session.query(Component, Item, Recipe)
                .join(Item, Item.id == Component.item_id)
                .join(Recipe, Recipe.id == Component.recipe_id)
            ).all()

            recipe_ids = [component.recipe_id for component,_,_ in components]
            recipe_inputs = RecipeService.get_recipe_inputs(session, recipe_ids)
            recipe_outputs = RecipeService.get_recipe_outputs(session, recipe_ids)
            recipe_buildings = RecipeService.get_recipe_buildings(session, recipe_ids)

            # Create a dictionary where the key is the component display name and the value is
            # a dictionary of associated recipes as default recipes, or alternate recipes.
            recipes_to_return = defaultdict(dict)

            for _, _, recipe in components:
                if recipe.id not in recipes_to_return:
                    recipes_to_return[recipe.id] = {
                        'id': recipe.id,
                        'display_name': recipe.display_name,
                        'class_name': recipe.class_name,
                        'manufactoring_duration': recipe.manufactoring_duration,
                        'produced_in': recipe_buildings[recipe.id],
                        'ingredients': recipe_inputs[recipe.id],
                        'products': recipe_outputs[recipe.id],
                        'variable_power_consumption_constant': recipe.variable_power_consumption_constant,
                        'variable_power_consumption_factor': recipe.variable_power_consumption_factor,
                    }

            recipe_id_keys_sorted = list(recipes_to_return.keys())
            recipe_id_keys_sorted.sort()

            recipes_to_return_as_list = [recipes_to_return[recipe_id_key] for recipe_id_key in recipe_id_keys_sorted]

            return recipes_to_return_as_list

    @staticmethod
    def get_component_recipes_grouped_details():
        with get_session() as session:
            components = (
                session.query(Component, Item, Recipe)
                .join(Item, Item.id == Component.item_id)
                .join(Recipe, Recipe.id == Component.recipe_id)
            ).all()

            recipe_ids = [component.recipe_id for component,_,_ in components]
            recipe_inputs = RecipeService.get_recipe_inputs(session, recipe_ids)
            recipe_outputs = RecipeService.get_recipe_outputs(session, recipe_ids)
            recipe_buildings = RecipeService.get_recipe_buildings(session, recipe_ids)

            # Create a dictionary where the key is the component display name and the value is
            # a dictionary of associated recipes as default recipes, or alternate recipes.
            recipes_to_return = defaultdict(dict)

            for component, item, recipe in components:
                if item.display_name not in recipes_to_return:
                    recipes_to_return[item.display_name] = {
                        'standard_product_display_name': item.display_name
                    }
                    if component.recipe_type == 'standard':
                        recipes_to_return[item.display_name]['standard'] = {
                            'id': component.recipe_id,
                            'display_name': recipe.display_name,
                            'class_name': recipe.class_name,
                            'manufactoring_duration': recipe.manufactoring_duration,
                            'produced_in': recipe_buildings[
                                component.recipe_id] if component.recipe_id in recipe_buildings else [],
                            'ingredients': recipe_inputs[
                                component.recipe_id] if component.recipe_id in recipe_inputs else [],
                            'products': recipe_outputs[
                                component.recipe_id] if component.recipe_id in recipe_outputs else [],
                            'variable_power_consumption_constant': recipe.variable_power_consumption_constant,
                            'variable_power_consumption_factor': recipe.variable_power_consumption_factor,
                        }
                        recipes_to_return[item.display_name]['alternate'] = []
                    else:
                        recipes_to_return[item.display_name]['standard'] = None
                        recipes_to_return[item.display_name]['alternate'] = [{
                            'id': component.recipe_id,
                            'display_name': recipe.display_name,
                            'class_name': recipe.class_name,
                            'manufactoring_duration': recipe.manufactoring_duration,
                            'produced_in': recipe_buildings[
                                component.recipe_id] if component.recipe_id in recipe_buildings else [],
                            'ingredients': recipe_inputs[
                                component.recipe_id] if component.recipe_id in recipe_inputs else [],
                            'products': recipe_outputs[
                                component.recipe_id] if component.recipe_id in recipe_outputs else [],
                            'variable_power_consumption_constant': recipe.variable_power_consumption_constant,
                            'variable_power_consumption_factor': recipe.variable_power_consumption_factor,
                        }]
                else:
                    if component.recipe_type == 'standard':
                        recipes_to_return[item.display_name]['standard'] = {
                            'id': component.recipe_id,
                            'display_name': recipe.display_name,
                            'class_name': recipe.class_name,
                            'manufactoring_duration': recipe.manufactoring_duration,
                            'produced_in': recipe_buildings[
                                component.recipe_id] if component.recipe_id in recipe_buildings else [],
                            'ingredients': recipe_inputs[
                                component.recipe_id] if component.recipe_id in recipe_inputs else [],
                            'products': recipe_outputs[
                                component.recipe_id] if component.recipe_id in recipe_outputs else [],
                            'variable_power_consumption_constant': recipe.variable_power_consumption_constant,
                            'variable_power_consumption_factor': recipe.variable_power_consumption_factor,
                        }
                    else:
                        recipes_to_return[item.display_name]['alternate'].append({
                            'id': component.recipe_id,
                            'display_name': recipe.display_name,
                            'class_name': recipe.class_name,
                            'manufactoring_duration': recipe.manufactoring_duration,
                            'produced_in': recipe_buildings[
                                component.recipe_id] if component.recipe_id in recipe_buildings else [],
                            'ingredients': recipe_inputs[
                                component.recipe_id] if component.recipe_id in recipe_inputs else [],
                            'products': recipe_outputs[
                                component.recipe_id] if component.recipe_id in recipe_outputs else [],
                            'variable_power_consumption_constant': recipe.variable_power_consumption_constant,
                            'variable_power_consumption_factor': recipe.variable_power_consumption_factor,
                        })

            display_name_keys_sorted = list(recipes_to_return.keys())
            display_name_keys_sorted.sort()

            recipes_to_return_as_list = [{
                'standard_product_display_name': recipes_to_return[display_name_key]['standard_product_display_name'],
                'standard': recipes_to_return[display_name_key]['standard'],
                'alternate': recipes_to_return[display_name_key]['alternate'],
            } for display_name_key in display_name_keys_sorted]

            return recipes_to_return_as_list
