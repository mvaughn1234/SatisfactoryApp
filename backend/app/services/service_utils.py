from app.models import Building, Item, Recipe

class ServiceUtils:
    def __init__(self):
        self.map_to_keys = {
        'building': self.building_summary_keys,
        'item': self.item_summary_keys,
        'recipe': self.recipe_summary_keys,
        }

    building_summary_keys = {
        'id',
        'class_name',
        'display_name',
        'description',
        'power_consumption'
    }

    item_summary_keys = {
        'id',
        'display_name',
        'description?',
        'small_icon?',
        'persistent_big_icon?',
    }

    recipe_summary_keys = {
        'id',
        'display_name',
        'class_name',
        'manufactoring_duration',
        'produced_in?',
    }

    object_from_type = {
        'recipe': Recipe,
        'building': Building,
        'item': Item,
    }

    def summary_from_full(self, object_dict, object_type):
        if object_dict is None:
            return None

        if isinstance(object_dict, list):
            object_info_pruned = [{key: obj.get(key) for key in self.map_to_keys[object_type]} for obj in object_dict]
        else:
            object_info_pruned = {key: object_dict.get(key) for key in self.map_to_keys[object_type]}

        return object_info_pruned

    def building_summary_from_full(self, object_dict):
        return self.summary_from_full(object_dict, 'building')

    def item_summary_from_full(self, object_dict):
        return self.summary_from_full(object_dict, 'item')

    def recipe_summary_from_full(self, object_dict):
        return self.summary_from_full(object_dict, 'recipe')
