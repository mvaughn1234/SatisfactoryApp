# Entry point for starting the Flask App.

from app import create_app

# Import the Config class from config.py
from config import Config

# Create the Flask app using the factory pattern and load the config
app = create_app(Config)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
