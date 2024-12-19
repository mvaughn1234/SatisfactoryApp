from flask import Blueprint, jsonify, request

from app.scripts.adjust_recipe_amounts_for_fluids import UpdateLiquids
from app.scripts.pulp_optimizer import optimizer
from app.services.configuration_service import ConfigurationService
from app.services.recipe_service import RecipeService

calculator_blueprint = Blueprint('calculator', __name__)

@calculator_blueprint.route('/', methods=['GET', 'POST'])
def calculator():
    print("Starting optimizer")
    # solution = optimizer()
    # if request.method == 'GET':
    #     return jsonify(solution)
    # if request.method == 'POST':
    #     pass
    # return jsonify({'message': 'Endpoint WIP'})

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization header with Bearer token is required'}), 400

    # Extract user_key from the Authorization header
    user_key = auth_header.split('Bearer ')[1]

    # Extract the JSON body
    data = request.json
    if not data or 'line' not in data:
        return jsonify({'error': 'line (active tab id) is required in the request body'}), 400

    line = data['line']

    try:
        # Load user configuration
        recipes = ConfigurationService.load_user_configuration(user_key)
        production_lines = ConfigurationService.load_production_lines(user_key, line)
        production_line = production_lines[0]
        # keys, values = production_line[0].items()
        # production_line = values

        if production_line is not None:
            if 'production_targets' in production_line and len(production_line['production_targets']) > 0:
                targets = production_line['production_targets']

                solution = optimizer(recipes, targets)

                # Return the user configuration as JSON
                return jsonify(solution), 200
            else:
                return jsonify({"message": "no production targets in production line",
                                "production_line": production_line}), 400
        else:
            return jsonify({"message": "couldn't find specified production line"}), 400

    except Exception as e:
        # Catch any unexpected errors and return a generic error response
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500


@calculator_blueprint.route('/update_liquids/', methods=['GET'])
def update_liquids():
    try:
        UpdateLiquids.adjust_recipe_amounts_for_fluids()
        return jsonify({"message": "success"})
    except Exception as e:
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500
