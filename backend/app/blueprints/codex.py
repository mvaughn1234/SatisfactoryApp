from flask import Blueprint, jsonify, request
from app.services.recipe_service import RecipeService

codex_blueprint = Blueprint('codex', __name__)
