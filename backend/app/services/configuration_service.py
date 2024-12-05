from app.models import User, UserRecipeConfig, UserProductionLine, ProductionLineTarget
from app.services.item_service import ItemService
from app.services.recipe_service import RecipeService
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

                # Pull all the component recipes to get ready to populate the default config
                component_recipes = RecipeService.get_component_recipes_details()

                # Add all the default recipe configs and link them to the new user
                for component_recipe in component_recipes:
                    recipe_config = UserRecipeConfig(
                        user_id=user.id,
                        recipe_id=component_recipe['id'],
                        known=False if component_recipe['display_name'].startswith('Alternate') else True,
                        excluded=False,
                        preferred=False,
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
    def load_production_lines(user_key):
        with get_session() as session:
            user = session.query(User).filter(User.user_key == user_key).first()
            if user is None:
                # Create a new user
                new_user = User(user_key=user_key)
                session.add(new_user)
                session.commit()

                return []

            user_lines = (
                session.query(UserProductionLine, ProductionLineTarget)
                .join(User, UserProductionLine.user_id == User.id)
                .join(ProductionLineTarget, ProductionLineTarget.line_id == UserProductionLine.id)
            ).all()

            item_ids = [target.item_id for _, target in user_lines]
            item_summaries = ItemService.get_item_by_id_summary(item_ids)
            production_lines = {}
            for production_line, target in user_lines:
                if production_line.id in production_lines.keys():
                    production_target = {
                        "id": target.id,
                        "product": ItemService.get_item_by_id_summary(target.item_id),
                        "rate": target.rate
                    }
                    production_lines[production_line.id]["production_targets"].append(production_target)
                else:
                    production_lines[production_line.id] = {
                        "id": production_line.line_id_frontend,
                        "name": production_line.name,
                        "production_targets": [{
                            "id": target.id,
                            "product": ItemService.get_item_by_id_summary(target.item_id),
                            "rate": target.rate
                        }],
                        "input_customizations": [],
                        "recipe_customizations": [],
                    }
            return production_lines

    @staticmethod
    def save_production_line(user_key, line):
        # Save the configuration in the database
        with (get_session() as session):
            user = session.query(User).filter(User.user_key == user_key).first()

            if user is None:
                raise UserNotFoundError("User with the provided key was not found.")

            if not line or not 'production_targets' in line:
                raise Exception("Production line cannot be empty.")

            production_line = session.query(UserProductionLine).filter(
                UserProductionLine.line_id_frontend == line['id']).first()

            if production_line is None:
                new_line = UserProductionLine(
                    user_id=user.id,
                    line_id_frontend=line['id'],
                    name=line['name']
                )
                session.add(new_line)
                session.commit()
                production_line = session.query(UserProductionLine).filter(
                    UserProductionLine.line_id_frontend == line['id']).first()

            # Step 2: Extract recipe_ids from the config list
            target_ids = {target['product']['id']: target['rate'] for target in line['production_targets']
                          if 'product' in target and 'rate' in target and 'id' in target['product']}

            # Step 3: Retrieve all relevant UserProductionLine rows in one query
            production_targets = (
                session.query(UserProductionLine, ProductionLineTarget)
                .join(User, UserProductionLine.user_id == User.id)
                .filter(UserProductionLine.line_id_frontend == line['id'])
                .join(ProductionLineTarget, ProductionLineTarget.line_id == UserProductionLine.id)
            ).all()

            targets = {target.item_id: target for _, target in production_targets}

            for target_id in target_ids.keys():
                if target_id in targets:
                    setattr(targets[target_id], 'rate', target_ids[target_id])
                else:
                    new_target = ProductionLineTarget(
                        line_id=production_line.id,
                        item_id=target_id,
                        rate=target_ids[target_id],
                    )
                    session.add(new_target)

            session.commit()
            return {"message": "Production line updated successfully"}, 200
