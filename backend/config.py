"""
Defines the application configuration (like database URI, secrets, etc.).

Config.py (this file) reads environment variables using os.environ.get() from the .env file.
.env holds environment-specific variables (e.g., SECRET_KEY, SQLALCHEMY_DATABASE_URI).

This allows having multiple .env files for different environments (e.g., .env.dev, .env.prod),
and switching between them easily without modifying the config file.
"""

import os

class Config:
    # Enable debug mode when running in a development environment
    FLASK_ENV = os.environ.get('FLASK_ENV', 'production')
    DEBUG = 'FLASK_ENV' == 'development'
    FLASK_DEBUG = DEBUG

    # Database configuration (PostgreSQL)
    if os.getenv('APP_ENV') == 'local':
        SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI_LOCAL')
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI')

    # Disable tracking modifications (optional but recommended)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Secret key for securely signing session cookies and tokens
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'defaultsecret'

    # Additional config options (optional)
    FLASK_ENV = os.environ.get('FLASK_ENV', 'production')
    DEBUG = 'FLASK_ENV' == 'development'
