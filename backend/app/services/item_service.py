from app.models import RecipeOutputs, Recipe, RecipeCompatibleBuildings
from app.models.item_models import Item, Component
from app.models.building_models import Building
from app.models.base import SessionLocal
from app.utils import get_session  # Assuming you save the context manager in session_manager.py

class ItemService:
    @staticmethod
    def get_all_items_detail():
        with get_session() as session:
            items =  session.query(Item).all()

            if items is None:
                return None

            return [item.to_dict_detail() for item in items]

    @staticmethod
    def get_all_items_summary():
        with get_session() as session:
            items =  session.query(Item).all()

            if items is None:
                return None

            return [item.to_dict_summary() for item in items]

    @staticmethod
    def get_item_by_id_summary(item_id):
        with get_session() as session:
            item = session.query(Item).filter(Item.id == item_id).first()

            if item is None:
                return None

            return item.to_dict_summary()

    @staticmethod
    def get_item_by_id_detail(item_id):
        with get_session() as session:
            item = session.query(Item).filter(Item.id == item_id).first()

            if item is None:
                return None

            return item.to_dict_detail()

    @staticmethod
    def get_component_items_detail():
        with get_session() as session:
            # Subquery to find items that are in recipe_outputs and meet the other conditions
            components = (
                session.query(Component, Item)
                .join(Item, Component.item_id == Item.id)
            ).all()

            components_to_return_dict = {}
            for component, item in components:
                if item.id not in components_to_return_dict:
                    components_to_return_dict[item.id] = item.to_dict_detail()

            components_to_return = [component for component in components_to_return_dict.values()]
            components_to_return.sort(key=lambda x: ord(x['display_name'][0]) if (x['display_name'] and x['display_name'][0]) else 0)

            return components_to_return

    @staticmethod
    def get_component_items_summary():
        with get_session() as session:
            # Subquery to find items that are in recipe_outputs and meet the other conditions
            components = (
                session.query(Component, Item)
                .join(Item, Component.item_id == Item.id)
            ).all()

            components_to_return_dict = {}
            for component, item in components:
                if item.id not in components_to_return_dict:
                    components_to_return_dict[item.id] = item.to_dict_summary()

            components_to_return = [component for component in components_to_return_dict.values()]
            components_to_return.sort(key=lambda x: ord(x['display_name'][0]) if (x['display_name'] and x['display_name'][0]) else 0)

            return components_to_return
