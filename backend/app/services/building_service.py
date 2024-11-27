from collections import defaultdict

from sqlalchemy.orm import aliased

from app.blueprints import buildings
from app.models import Building, Item, RecipeOutputs, Recipe, RecipeInputs
from app.services.item_service import ItemService
from app.services.service_utils import ServiceUtils
from app.utils import get_session


class BuildingService:
    @staticmethod
    def building_summary_from_full(building_dict):
        if building_dict is None:
            return None

        if type(building_dict) == list:
            buildings_info_pruned = [{
                'id': building['id'],
                'class_name': building['class_name'],
                'display_name': building['display_name'],
                'description': building['description'],
                'power_consumption': building['power_consumption'],
            } for building in building_dict]
        else:
            building = building_dict
            buildings_info_pruned = {
                'id': building['id'],
                'class_name': building['class_name'],
                'display_name': building['display_name'],
                'description': building['description'],
                'power_consumption': building['power_consumption'],
            }

        return buildings_info_pruned

    @staticmethod
    def get_construction_components(building_ids):
        with get_session() as session:
            buildings = session.query(Building).filter(Building.id.in_(building_ids)).all()

            if buildings is None:
                return None

            output_item = aliased(Item)
            input_item = aliased(Item)

            build_to_desc_class_names = [building.class_name.replace('Build', 'Desc') for building in buildings]

            # Query to get the input (component) Items for each class_name in the input list
            components_query = (
                session.query(output_item.class_name, input_item)
                .join(output_item.recipe_outputs)  # Use ORM relationship from Item to RecipeOutputs
                .join(RecipeOutputs.recipe)  # Explicit join for RecipeInputs
                .join(Recipe.inputs)  # Explicit join for RecipeInputs
                .join(input_item, RecipeInputs.item_id == input_item.id)  # Join input item to get component details
                .filter(output_item.class_name.in_(build_to_desc_class_names))  # Filter for the list of output class names
                .order_by(output_item.class_name)  # Order by output class_name to organize the results
                .all()
            )

            # Create a dictionary where the key is the output class_name and the value is a list of component Items
            output_to_components = defaultdict(list)

            # Organize the results: group the components by their output item
            for output_class_name, component_item in components_query:
                # Call the to_dict() method on each component item and store in the dictionary
                output_to_components[output_class_name].append(component_item.to_dict_summary())

            # Convert the dictionary into a list of lists if required
            components_list = [components for components in output_to_components.values()]

            return components_list

    @staticmethod
    def get_building_by_id_summary(building_id):
        with get_session() as session:
            building = session.query(Building).filter(Building.id == building_id).first()

            if building is None:
                return None

            building_representation = building.to_dict_summary()

            return building_representation

    @staticmethod
    def get_building_by_id_detail(building_id):
        with get_session() as session:
            building = session.query(Building).filter(Building.id == building_id).first()

            if building is None:
                return None

            building_representation = building.to_dict_detail()
            construction_items = BuildingService.get_construction_components([building.id])
            if construction_items is not None:
                building_representation['construction_components'] = construction_items,
            return building_representation

    @staticmethod
    def get_all_buildings_summary():
        with get_session() as session:
            all_buildings = session.query(Building).all()

            if buildings is None:
                return None

            buildings_to_return = [building.to_dict_summary() for building in all_buildings]

            # Prune off extra information since this is a summary endpoint
            utils = ServiceUtils()
            buildings_to_return_pruned = utils.building_summary_from_full(buildings_to_return)

            return buildings_to_return_pruned

    @staticmethod
    def get_all_buildings_detail():
        with get_session() as session:
            all_buildings = session.query(Building).all()

            if buildings is None:
                return None

            buildings_to_return = [building.to_dict_detail() for building in all_buildings]
            building_ids = [building.id for building in all_buildings]
            components = BuildingService.get_construction_components(building_ids)

            for building_as_dict, construction_components in zip(buildings_to_return, components):
                building_as_dict['construction_components'] = construction_components

            return buildings_to_return