# Satisfactory_App/backend/app/migrations/env.py
from logging.config import fileConfig
from alembic import context
from app import create_app, db  # Import your create_app function and db instance
from app.models.base import Base  # Import Base for metadata

# This is the Alembic Config object, which provides access to the .ini file
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Set up target metadata for Alembic's autogenerate
target_metadata = Base.metadata

# Function to run migrations in "offline" mode.
# This is useful for generating SQL scripts without connecting to the DB.
def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()

# Function to run migrations in "online" mode.
def run_migrations_online():
    """Run migrations in 'online' mode."""
    # Create the Flask app and push the app context
    app = create_app('config.Config')

    # Ensure the app context is managed correctly
    with app.app_context():
        connectable = db.engine  # Use Flask's SQLAlchemy engine

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                compare_type=True
            )

            with context.begin_transaction():
                context.run_migrations()

# Check if we are running migrations offline or online and call the appropriate function
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
