from app.models import User, UserRecipeConfig, UserProductionLine, ProductionLineTarget
from app.services.item_service import ItemService
from app.services.recipe_service import RecipeService
from app.services.service_utils import ServiceUtils
from app.utils import get_session


class UserNotFoundError(Exception):
    pass

class ConfigurationService:
    @staticmethod
    def load_user_configuration(user_key):
        with get_session() as session:
            user = session.query(User).filter(User.user_key == user_key).first()
            if user is None:
                # Create a new user
                new_user = User(user_key=user_key)
                session.add(new_user)
                session.commit()

                user = session.query(User).filter(User.user_key == user_key).first()

            user_config = session.query(UserRecipeConfig, User).join(User, UserRecipeConfig.user_id == User.id).filter(
                User.user_key == user_key).all()

            if user_config is None or len(user_config) == 0:
                # Pull all the component recipes to get ready to populate the default config
                component_recipes = RecipeService.get_component_recipes_details()

                # Add all the default recipe configs and link them to the new user
                for component_recipe in component_recipes:
                    recipe_config = UserRecipeConfig(
                        user_id=user.id,
                        recipe_id=component_recipe['id'],
                        # known=False if component_recipe['display_name'].startswith('Alternate') else True,
                        known=True,
                        excluded=False,
                        preferred=component_recipe['id'],
                    )
                    session.add(recipe_config)

                session.commit()

                user_config = session.query(UserRecipeConfig, User).join(User, UserRecipeConfig.user_id == User.id).filter(
                    User.user_key == user_key).all()

        user_config_json = {}
        for recipe_config, _ in user_config:
            user_config_json[recipe_config.recipe_id] = {
                'recipe_id': recipe_config.recipe_id,
                'known': recipe_config.known,
                'excluded': recipe_config.excluded,
                'preferred': recipe_config.preferred,
            }

        return user_config_json

    @staticmethod
    def save_user_configuration(user_key, config):
        # Save the configuration in the database
        with get_session() as session:
            user = session.query(User).filter(User.user_key == user_key).first()

            if user is None:
                raise UserNotFoundError("User with the provided key was not found.")

            # Step 2: Extract recipe_ids from the config list
            recipe_ids = [int(key) for key in config.keys()]

            print('recipe_ids: ', recipe_ids)
            # Step 3: Retrieve all relevant UserRecipeConfig rows in one query
            recipe_configs = session.query(UserRecipeConfig).filter(
                UserRecipeConfig.user_id == user.id,
                UserRecipeConfig.recipe_id.in_(recipe_ids)
            ).all()


            # Step 4: Map recipe_id to the corresponding UserRecipeConfig row
            recipe_config_map = {rc.recipe_id: rc for rc in recipe_configs}

            print('config.values(): ',config.values())

            # Step 5: Apply updates to the relevant rows
            for recipe_to_update in recipe_ids:
                recipe_id = recipe_to_update
                update = config[str(recipe_id)]
                print('recipe_ids: ', recipe_id)
                print('recipe_config_map_keys: ', recipe_config_map.keys())
                if recipe_id and recipe_id in recipe_config_map:
                    print('recipe_id in recipe_config_map: ', recipe_id)
                    recipe_config = recipe_config_map[recipe_id]
                    # Update fields from the update dictionary
                    for key, value in update.items():
                        print('key, value in update.item(): ', key, value)
                        if key != 'recipe_id' and hasattr(recipe_config, key):
                            print('model has attribute: ', key)
                            setattr(recipe_config, key, value)

            # Step 6: Commit all updates in a single transaction
            session.commit()
            return {"message": "Recipe configurations updated successfully"}, 200

    @staticmethod
    def load_production_lines(user_key, line=None):
        with get_session() as session:
            user = session.query(User).filter(User.user_key == user_key).first()
            if user is None:
                # Create a new user
                new_user = User(user_key=user_key)
                session.add(new_user)
                session.commit()
                user = session.query(User).filter(User.user_key == user_key).first()

            if line is not None:
                if ServiceUtils.is_valid_line_id_frontend(line):
                    user_lines = (
                        session.query(UserProductionLine)
                        .join(User, UserProductionLine.user_id == User.id)
                        .filter(User.user_key == user_key)
                        .filter(UserProductionLine.line_id_frontend == line)
                    ).all()
                else:
                    raise Exception("Invalid production line, should be string of the form \d+.")

            else:
                user_lines = (
                    session.query(UserProductionLine)
                    .join(User, UserProductionLine.user_id == User.id)
                    .filter(User.user_key == user_key)
                ).all()

            if user_lines is None or len(user_lines) == 0:
                default_line = UserProductionLine(
                    line_id_frontend='0',
                    name='Default Production Line',
                    user_id=user.id
                )

                session.add(default_line)
                session.commit()

                return [{
                    'id': '0',
                    'name': 'Default Production Line',
                    'production_targets': [],
                    'input_customizations': [],
                    'output_customizations': [],
                }]

            production_lines = {}

            for user_line in user_lines:
                new_line = {
                    'id': user_line.line_id_frontend,
                    'name': user_line.name,
                    'production_targets': [],
                    'input_customizations': [],
                    'output_customizations': [],
                }

                production_lines[user_line.id] = new_line


            user_targets_by_line = (
                session.query(ProductionLineTarget)
                .join(UserProductionLine, UserProductionLine.id == ProductionLineTarget.line_id)
                .join(User, UserProductionLine.user_id == User.id)
                .filter(User.user_key == user_key)  # Filter on user_key applied after User join
            ).all()

            if user_targets_by_line is None or len(user_targets_by_line) == 0:
                return list(production_lines.values())

            item_ids = [target.item_id for target in user_targets_by_line]

            for target in user_targets_by_line:
                if target.line_id in production_lines.keys():
                    new_target = {
                            "id": target.target_id_frontend,
                            "product": ItemService.get_item_by_id_summary(target.item_id),
                            "rate": target.rate
                        }
                    production_lines[target.line_id]['production_targets'].append(new_target)



            return list(production_lines.values())

    @staticmethod
    def save_production_line(user_key, line, updates):
        # Save the configuration in the database
        with get_session() as session:
            user = session.query(User).filter(User.user_key == user_key).first()

            if user is None:
                raise UserNotFoundError("User with the provided key was not found.")

            if not line or not updates:
                raise Exception("Production line cannot be empty.")

            production_line = session.query(UserProductionLine).join(User,User.id == UserProductionLine.user_id).filter(
                UserProductionLine.line_id_frontend == line).filter(User.user_key == user_key).first()

            if production_line is None:
                if 'name' not in updates:
                    return {"message": {"error": "couldn't find name in updates", "updates": updates}}
                else:
                    new_line = UserProductionLine(
                        line_id_frontend=line,
                        name=updates['name'],  # Access `name` from `updates`
                        user_id=user.id
                    )

                    session.add(new_line)
                    session.commit()

                    production_line = session.query(UserProductionLine).filter(
                        UserProductionLine.line_id_frontend == line).first()

            # Extract targets from the updates payload
            fe_targets_by_target_id_frontend = {
                target['id']: target for target in updates['production_targets']
                if 'id' in target and 'rate' in target
            }

            # Retrieve all relevant UserProductionLine rows in one query
            production_targets = (
                session.query(UserProductionLine, ProductionLineTarget)
                .join(User, UserProductionLine.user_id == User.id)
                .join(ProductionLineTarget, ProductionLineTarget.line_id == UserProductionLine.id)
                .filter(User.user_key == user_key)  # Filter by user_key
                .filter(UserProductionLine.line_id_frontend == line)  # Filter by line_id_frontend
            ).all()

            # Map backend target rows by `target_id_frontend`
            be_target_row_models_by_target_id_frontend = {
                target.target_id_frontend: target for _, target in production_targets
            }

            # Update or add rows
            for target_id_frontend, fe_target in fe_targets_by_target_id_frontend.items():
                product = fe_target.get('product')
                item_id = product.get('id') if product else None  # Handle null product

                if target_id_frontend in be_target_row_models_by_target_id_frontend:
                    # Update existing row
                    be_target = be_target_row_models_by_target_id_frontend[target_id_frontend]
                    be_target.rate = fe_target['rate']
                    be_target.item_id = item_id
                else:
                    # Add a new row
                    new_target = ProductionLineTarget(
                        line_id=production_line.id,
                        target_id_frontend=target_id_frontend,
                        item_id=item_id,
                        rate=fe_target['rate'],
                    )
                    session.add(new_target)

            # Delete rows that are no longer in updates
            for target_id_frontend in be_target_row_models_by_target_id_frontend.keys():
                if target_id_frontend not in fe_targets_by_target_id_frontend:
                    session.delete(be_target_row_models_by_target_id_frontend[target_id_frontend])

            session.commit()
            return {"message": "Production line updated successfully"}, 200
