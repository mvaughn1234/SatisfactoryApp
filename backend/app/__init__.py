"""
Initializes the Flask app and extensions (SQLAlchemy, Flask-Migrate).
./app/__init__.py
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

from app.scripts.insert_data import initialize_database
# Ensure models are imported

import logging

# Create the SQLAlchemy object (used to manage database models)
db = SQLAlchemy()

# Create the migration object (used for handling database migrations)
migrate = Migrate()

def create_app(config_class):
    # Create a Flask app instance
    app = Flask(__name__)

    # Load the configuration settings from the config class
    app.config.from_object(config_class)

    # Since your frontend and backend will be served from different origins (the backend from Flask and the frontend from Vite/React or similar), you need to ensure CORS (Cross-Origin Resource Sharing) is configured correctly.
    # Make sure you allow all necessary origins and headers:
    # This allows all origins, which is useful for development. However, for production, you'll want to restrict this to your frontend’s domain.
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Initialize the database and migration extensions

    db.init_app(app)
    migrate.init_app(app, db)

    # Configure the logger
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler("app.log"),  # Logs to a file named `services.log`
            logging.StreamHandler()  # Logs to the console
        ]
    )

    # logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

    # Import all models explicitly
    from app.models.item_models import Item, AlienPowerFuel, Component, Consumable, NuclearFuel, PowerShard, RawResource
    from app.models.building_models import Building, Extractor, Manufacturer
    from app.models.recipe_models import Recipe, RecipeOutputs, RecipeInputs, RecipeCompatibleBuildings

    # Import and register your API routes here
    from .routes import api_blueprint
    from app.blueprints.recipes import recipes_blueprint
    from app.blueprints.items import items_blueprint
    from app.blueprints.buildings import buildings_blueprint
    from app.blueprints.codex import codex_blueprint
    from app.blueprints.calculator import calculator_blueprint
    from app.blueprints.users import users_blueprint

    app.register_blueprint(recipes_blueprint, url_prefix='/api/recipes')
    app.register_blueprint(items_blueprint, url_prefix='/api/items')
    app.register_blueprint(buildings_blueprint, url_prefix='/api/buildings')
    app.register_blueprint(codex_blueprint, url_prefix='/api/codex')
    app.register_blueprint(calculator_blueprint, url_prefix='/api/calculator')
    app.register_blueprint(users_blueprint, url_prefix='/api/users')
    app.register_blueprint(api_blueprint, url_prefix='/api/data')

    # initialize_database()

    return app