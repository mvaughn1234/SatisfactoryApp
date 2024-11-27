from flask import Blueprint, jsonify, request

from app.scripts.pulp_optimizer import optimizer
from app.services.recipe_service import RecipeService

calculator_blueprint = Blueprint('calculator', __name__)

@calculator_blueprint.route('/', methods=['GET', 'POST'])
def calculator():
    print("Starting optimizer")
    solution = optimizer()
    if request.method == 'GET':
        return jsonify(solution)
    if request.method == 'POST':
        pass
    return jsonify({'message': 'Endpoint WIP'})