"""
Define your API routes here. You can use Flask blueprints to modularize different parts of your app,
separating codex, recipe tracking, and calculator logic.

For example:

- codex.py: Routes related to retrieving game data (items, buildings, etc.).
- recipes.py: Routes for recipe tracking and ranking.
- calculator.py: Routes for the production calculator.

*register the blueprints in __init__.py*
"""

from flask import Blueprint, jsonify
from app.scripts.insert_data import initialize_database

api_blueprint = Blueprint('api', __name__)


@api_blueprint.route('/', methods=['GET'])
def get_data():
    initialize_database()
    return jsonify({"message": "This is a sample API response"})
