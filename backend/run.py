"""
Entry point for starting the Flask App.
"""

from dotenv import load_dotenv
from app import create_app
from config import Config # Import the Config class from config.py

# Load the .env file
load_dotenv()

# Create the Flask app using the factory pattern and load the config
app = create_app(Config)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
