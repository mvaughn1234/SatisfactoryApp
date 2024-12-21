"""
Satisfactory_App/backend/run.py
Entry point for starting the Flask App.
"""

from dotenv import load_dotenv
import os

# Determine which .env file to load based on FLASK_ENV or APP_ENV
env_mode = os.getenv('FLASK_ENV', 'development')  # Default to development if not set
env_file = f".env.{env_mode}"
load_dotenv(env_file)

print("After loading dotenv:", os.getenv("FLASK_ENV"), os.getenv("SQLALCHEMY_DATABASE_URI_LOCAL"))

from app import create_app
from config import Config # Import the Config class from config.py

# Create the Flask app using the factory pattern and load the config
app = create_app(Config)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
