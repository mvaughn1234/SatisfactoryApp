import logging

from cachetools import TTLCache
from sqlalchemy.exc import SQLAlchemyError

from app.models import UserRecipeConfig, UserProductionLine, ProductionLineTarget, Item
from app.services.item_service import ItemService
from app.services.recipe_service import RecipeService
from app.services.service_utils import ServiceUtils
from app.services.user_service import UserService
from app.utils import get_session

user_config_cache = TTLCache(maxsize=1000, ttl=300)
logger = logging.getLogger(__name__)


class UserNotFoundError(Exception):
    pass


class ConfigurationService:
    @staticmethod
    def load_user_configuration(user_key):
        # Check the cache first
        if user_key in user_config_cache:
            return user_config_cache[user_key]

        try:
            with get_session() as session:
                # Ensure the user exists
                user = UserService.load_user(user_key, session)

                # Query for existing configurations
                user_config = session.query(UserRecipeConfig).filter(
                    UserRecipeConfig.user_id == user.id
                ).all()

                if not user_config:
                    # Pull component recipes and create default configs
                    component_recipes = RecipeService.get_component_recipes_details()
                    if not component_recipes:
                        raise RuntimeError("Failed to fetch component recipes.")

                    default_configs = [
                        UserRecipeConfig(
                            user_id=user.id,
                            recipe_id=component_recipe['id'],
                            known=True,
                            excluded=False,
                            preferred=component_recipe['id'],
                        )
                        for component_recipe in component_recipes
                    ]
                    session.bulk_save_objects(default_configs)
                    session.commit()
                    user_config = session.query(UserRecipeConfig).filter(
                        UserRecipeConfig.user_id == user.id
                    ).all()

            # Convert to JSON and cache the result
            user_config_json = {
                recipe_config.recipe_id: {
                    'recipe_id': recipe_config.recipe_id,
                    'known': recipe_config.known,
                    'excluded': recipe_config.excluded,
                    'preferred': recipe_config.preferred,
                }
                for recipe_config in user_config
            }

            user_config_cache[user_key] = user_config_json
            return user_config_json

        except UserNotFoundError:
            raise RuntimeError(f"User with key {user_key} could not be found or created.")
        except SQLAlchemyError as e:
            logger.error(f"Database error: {e}")
            raise RuntimeError(f"An error occurred while accessing the database: {e}")

    @staticmethod
    def save_user_configuration(user_key: str, config: dict):
        """
        Save or update the recipe configurations for a user.

        Args:
            user_key (str): The unique key of the user.
            config (dict): A dictionary where keys are recipe IDs (as strings)
                           and values are dictionaries with update data.

        Returns:
            dict: A success message.
            int: HTTP status code.
        """
        if not isinstance(config, dict):
            logger.error("Invalid configuration format: expected a dictionary.")
            return {"message": "Invalid configuration format."}, 400

        with get_session() as session:
            # Validate the user exists
            user = UserService.load_user(user_key, session)

            # Extract and validate recipe IDs
            try:
                recipe_ids = [int(key) for key in config.keys()]
            except ValueError:
                logger.error("Invalid recipe ID in configuration keys.")
                return {"message": "Invalid recipe ID format in configuration."}, 400

            # Retrieve existing recipe configurations in one query
            recipe_configs = session.query(UserRecipeConfig).filter(
                UserRecipeConfig.user_id == user.id,
                UserRecipeConfig.recipe_id.in_(recipe_ids)
            ).all()

            # Map recipe IDs to their corresponding UserRecipeConfig rows
            recipe_config_map = {rc.recipe_id: rc for rc in recipe_configs}

            # Update relevant recipe configurations
            for recipe_id in recipe_ids:
                if recipe_id not in recipe_config_map:
                    logger.warning(f"Recipe ID {recipe_id} not found for user {user.id}. Skipping.")
                    continue

                recipe_config = recipe_config_map[recipe_id]
                update_data = config.get(str(recipe_id), {})

                # Apply updates to the recipe configuration
                for key, value in update_data.items():
                    if key != 'recipe_id' and hasattr(recipe_config, key):
                        setattr(recipe_config, key, value)
                        logger.debug(f"Updated {key} for recipe ID {recipe_id} to {value}.")

            # Commit the updates
            try:
                session.commit()
                if user_key in user_config_cache:
                    user_config_cache.pop(user_key, None)
                logger.info(f"Recipe configurations updated successfully for user {user.id}.")
                return {"message": "Recipe configurations updated successfully"}, 200
            except SQLAlchemyError as e:
                logger.exception(f"Database error during save_user_configuration: {e}")
                return {"message": "An error occurred while saving configurations."}, 500

    @staticmethod
    def load_production_lines(user_key: str, line: str = None):
        """
        Load the production lines for a user. If no lines exist, initializes a default line.

        Args:
            user_key (int): The unique key of the user.
            line (str, optional): The frontend line ID to filter by. Defaults to None.

        Returns:
            list: A list of production line dictionaries.
        """
        with get_session() as session:
            # Validate the user exists
            user = UserService.load_user(user_key, session)

            # Query user production lines
            try:
                query = session.query(UserProductionLine).filter(UserProductionLine.user_id == user.id)
                if line:
                    if ServiceUtils.is_valid_line_id_frontend(line):
                        query = query.filter(UserProductionLine.line_id_frontend == line)
                    else:
                        raise ValueError("Invalid production line, should be a string of the form '\\d+'.")

                user_lines = query.all()

                # Initialize a default line if none exist
                if not user_lines:
                    # default_line = UserProductionLine(
                    #     line_id_frontend='0',
                    #     name='Default Production Line',
                    #     user_id=user.id
                    # )
                    # session.add(default_line)
                    # session.commit()
                    # return [{
                    #     'id': '0',
                    #     'name': 'Default Production Line',
                    #     'production_targets': [],
                    #     'input_customizations': [],
                    #     'output_customizations': [],
                    # }]
                    logger.info(f"No production lines found for user {user.id}. Creating a default production line.")
                    default_items = ['Rotor', 'Reinforced Iron Plate']
                    default_items_rates = [5000, 5000]
                    item_objects = session.query(Item).filter(Item.display_name.in_(default_items)).all()
                    production_targets = [
                        {'id': f"0:{item.id}", 'product': ItemService.get_item_by_id_summary(item.id), 'rate': rate}
                        for item, rate in zip(item_objects, default_items_rates)
                    ]
                    default_updates = {
                        "name": "Default Production Line",
                        "production_targets": production_targets,
                    }
                    ConfigurationService.save_production_line(user_key, "0", default_updates)

                    # Reload the default line to return it
                    user_lines = session.query(UserProductionLine).filter(UserProductionLine.user_id == user.id).all()

                # Prepare production line structure
                production_lines = {
                    user_line.id: {
                        'id': user_line.line_id_frontend,
                        'name': user_line.name,
                        'production_targets': [],
                        'input_customizations': [],
                        'output_customizations': [],
                    }
                    for user_line in user_lines
                }

                # Query production line targets
                user_targets_by_line = session.query(ProductionLineTarget).filter(
                    ProductionLineTarget.line_id.in_(production_lines.keys())
                ).all()

                if not user_targets_by_line:
                    return list(production_lines.values())

                # Batch fetch item summaries
                item_ids = [target.item_id for target in user_targets_by_line]
                item_summaries = ItemService.get_item_by_id_summary(item_ids)

                # Map item summaries by ID
                item_summary_map = {item['id']: item for item in item_summaries}

                # Attach production targets to lines
                for target in user_targets_by_line:
                    if target.line_id in production_lines:
                        production_lines[target.line_id]['production_targets'].append({
                            "id": target.target_id_frontend,
                            "product": item_summary_map.get(target.item_id, {}),
                            "rate": target.rate,
                        })

                return list(production_lines.values())

            except SQLAlchemyError as e:
                logger.exception(f"Database error while loading production lines for user {user_key}: {e}")
                raise RuntimeError("An error occurred while loading production lines.")

    @staticmethod
    def save_production_line(user_key: str, line: str, updates: dict):
        """
        Save or update a production line and its targets for a user.

        Args:
            user_key (int): The unique key of the user.
            line (str): The frontend line ID to update.
            updates (dict): A dictionary containing the updates for the production line.

        Returns:
            tuple: A response dictionary and an HTTP status code.
        """
        if not line or not updates:
            raise ValueError("Production line and updates cannot be empty.")

        with get_session() as session:
            # Validate the user exists
            user = UserService.load_user(user_key, session)

            # Retrieve or create the production line
            production_line = session.query(UserProductionLine).filter(
                UserProductionLine.user_id == user.id,
                UserProductionLine.line_id_frontend == line
            ).first()

            if production_line is None:
                if 'name' not in updates:
                    return {"message": {"error": "Missing 'name' in updates", "updates": updates}}, 400

                # Create a new production line
                production_line = UserProductionLine(
                    line_id_frontend=line,
                    name=updates['name'],
                    user_id=user.id
                )
                session.add(production_line)
                session.commit()
                logger.info(f"Created new production line '{updates['name']}' for user {user.id}")

            # Extract frontend targets from the updates
            fe_targets_by_target_id_frontend = {
                target['id']: target for target in updates.get('production_targets', [])
                if 'id' in target and 'rate' in target
            }

            # Retrieve backend targets for the production line
            production_targets = session.query(ProductionLineTarget).filter(
                ProductionLineTarget.line_id == production_line.id
            ).all()

            # Map backend targets by frontend target ID
            be_target_row_models_by_target_id_frontend = {
                target.target_id_frontend: target for target in production_targets
            }

            # Update or add targets
            for target_id_frontend, fe_target in fe_targets_by_target_id_frontend.items():
                product = fe_target.get('product', {})
                item_id = product.get('id')  # Handle null product gracefully

                if target_id_frontend in be_target_row_models_by_target_id_frontend:
                    # Update existing target
                    be_target = be_target_row_models_by_target_id_frontend[target_id_frontend]
                    be_target.rate = fe_target['rate']
                    be_target.item_id = item_id
                    logger.debug(f"Updated target '{target_id_frontend}' for line '{line}'")
                else:
                    # Add new target
                    new_target = ProductionLineTarget(
                        line_id=production_line.id,
                        target_id_frontend=target_id_frontend,
                        item_id=item_id,
                        rate=fe_target['rate'],
                    )
                    session.add(new_target)
                    logger.info(f"Added new target '{target_id_frontend}' for line '{line}'")

            # Delete obsolete targets
            for target_id_frontend in be_target_row_models_by_target_id_frontend.keys():
                if target_id_frontend not in fe_targets_by_target_id_frontend:
                    session.delete(be_target_row_models_by_target_id_frontend[target_id_frontend])
                    logger.info(f"Deleted obsolete target '{target_id_frontend}' from line '{line}'")

            # Commit all changes
            try:
                session.commit()
                logger.info(f"Production line '{line}' updated successfully for user {user.id}")
                return {"message": "Production line updated successfully"}, 200
            except SQLAlchemyError as e:
                logger.exception(f"Database error while updating production line for user {user_key}: {e}")
                return {"message": "An error occurred while saving the production line."}, 500
