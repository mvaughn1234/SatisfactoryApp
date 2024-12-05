from flask import Blueprint, jsonify, request

from app.services.configuration_service import ConfigurationService
from app.services.recipe_service import RecipeService

users_blueprint = Blueprint('users', __name__)

@users_blueprint.route('/config/recipes', methods=['GET'])
def get_user_config():
    # Extract the Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization header with Bearer token is required'}), 400

    # Extract user_key from the Authorization header
    user_key = auth_header.split('Bearer ')[1]

    try:
        # Load user configuration
        user_config = ConfigurationService.load_user_configuration(user_key)

        # Return the user configuration as JSON
        return jsonify(user_config), 200
    except Exception as e:
        # Catch any unexpected errors and return a generic error response
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500

@users_blueprint.route('/config/recipes', methods=['POST'])
def save_user_config():
    # Extract the Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization header with Bearer token is required'}), 400

    # Extract user_key from the Authorization header
    user_key = auth_header.split('Bearer ')[1]

    # Extract the JSON body
    data = request.json
    if not data or 'config' not in data:
        return jsonify({'error': 'config is required in the request body'}), 400

    config = data['config']

    try:
        # Load user configuration
        ConfigurationService.save_user_configuration(user_key, config)

        # Return the user configuration as JSON
        return jsonify({"message": "Configuration saved successfully"}), 200
    except Exception as e:
        # Catch any unexpected errors and return a generic error response
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500

@users_blueprint.route('/config/lines/load', methods=['POST'])
def get_user_line():
    # Extract the JSON body
    data = request.json
    if not data or 'user_key' not in data:
        return jsonify({'error': 'user_key is required in the request body'}), 400

    # Extract user_key
    user_key = data['user_key']
    try:
        # Load user configuration
        user_lines = ConfigurationService.load_production_lines(user_key)

        # Return the user configuration as JSON
        return jsonify(user_lines)
    except Exception as e:
        # Catch any unexpected errors and return a generic error response
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500

@users_blueprint.route('/config/lines/update', methods=['POST'])
def save_user_line():
    # Extract the JSON body
    data = request.json

    if not data:
        return jsonify({'error': 'Request body is empty. Must include user_key and config'}), 400

    missing_fields = []
    if 'user_key' not in data:
        missing_fields.append('user_key')
    if 'line' not in data:
        missing_fields.append('line')

    if missing_fields:
        return jsonify({'error': f"Missing required fields: {', '.join(missing_fields)}"}), 400

    # Extract user_key
    user_key = data['user_key']
    line = data['line']

    try:
        # Load user configuration
        ConfigurationService.save_production_line(user_key, line)

        # Return the user configuration as JSON
        return jsonify({"message": "Configuration saved successfully"}), 200
    except Exception as e:
        # Catch any unexpected errors and return a generic error response
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500
