from flask import Blueprint, jsonify, redirect, url_for
from app.services.recipe_service import RecipeService

recipes_blueprint = Blueprint('recipes', __name__)

@recipes_blueprint.route('/detail/', methods=['GET'])
def get_all_recipes_detail():
    recipes = RecipeService.get_all_recipes_detail()
    return jsonify(recipes)

@recipes_blueprint.route('/summary/', methods=['GET'])
def get_all_recipes_summary():
    recipes = RecipeService.get_all_recipes_summary()
    return jsonify(recipes)

@recipes_blueprint.route('/components/detail/', methods=['GET'])
def get_component_recipes_details():
    recipes = RecipeService.get_component_recipes_details()
    return jsonify(recipes)

@recipes_blueprint.route('/components/grouped/detail/', methods=['GET'])
def get_component_recipes_grouped_details():
    recipes = RecipeService.get_component_recipes_grouped_details()
    return jsonify(recipes)

@recipes_blueprint.route('/detail/<int:recipe_id>', methods=['GET'])
def get_recipe_by_id_detail(recipe_id):
    recipe = RecipeService.get_recipe_by_id_detail(recipe_id)
    if recipe:
        return jsonify(recipe)
    else:
        return jsonify({'message': 'Recipe not found'}), 404

@recipes_blueprint.route('/summary/<int:recipe_id>', methods=['GET'])
def get_recipe_by_id_summary(recipe_id):
    recipe = RecipeService.get_recipe_by_id_summary(recipe_id)
    if recipe:
        return jsonify(recipe)
    else:
        return jsonify({'message': 'Recipe not found'}), 404
# Route to get recipes by building

@recipes_blueprint.route('/building/detail/<int:building_id>', methods=['GET'])
def get_recipes_by_building(building_id):
    recipes = RecipeService.get_recipes_by_building(building_id)
    if recipes:
        return jsonify(recipes)
    else:
        return jsonify({'message': 'No recipes found for this building'}), 404

@recipes_blueprint.route('/components/ids/', methods=['GET'])
def get_component_recipes_ids():
    recipe_ids = RecipeService.get_component_recipes_ids()
    if recipe_ids:
        return jsonify(recipe_ids)
    else:
        return jsonify({'message': 'No recipe ids found'}), 404

# Redirects
# Handle Redirects
@recipes_blueprint.route('/', methods=['GET'])
@recipes_blueprint.route('/detail', methods=['GET'])
def redirect_to_detail():
    return redirect(url_for('recipes.get_all_recipes_detail'))

@recipes_blueprint.route('/summary', methods=['GET'])
def redirect_to_summary():
    return redirect(url_for('recipes.get_all_recipes_summary'))

@recipes_blueprint.route('/components', methods=['GET'])
@recipes_blueprint.route('/components/', methods=['GET'])
@recipes_blueprint.route('/components/detail', methods=['GET'])
def redirect_to_components():
    return redirect(url_for('recipes.get_component_recipes_details'))

@recipes_blueprint.route('/components/ids', methods=['GET'])
def redirect_to_components_ids():
    return redirect(url_for('recipes.get_component_recipes_ids'))

@recipes_blueprint.route('/<int:recipe_id>', methods=['GET'])
@recipes_blueprint.route('/<int:recipe_id>/', methods=['GET'])
@recipes_blueprint.route('/detail/<int:recipe_id>/', methods=['GET'])
def redirect_to_id_detail(recipe_id):
    return redirect(url_for('recipes.get_recipe_by_id_detail', recipe_id=recipe_id))

@recipes_blueprint.route('/summary/<int:recipe_id>/', methods=['GET'])
def redirect_to_id_summary(recipe_id):
    return redirect(url_for('recipes.get_recipe_by_id_summary', recipe_id=recipe_id))
