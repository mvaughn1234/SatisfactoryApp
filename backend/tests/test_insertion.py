import unittest

from app.models import Item, Building, Recipe
from app.scripts.insert_data import filter_by_attributes, filter_objects
from app.scripts.insert_data import classify_objects_into_subtypes
from app.scripts.insert_data import insert_fully_classified_objects

# Mock game data to be used in the tests
mock_game_data = [
    {
        "NativeClass": "SomeClass",
        "classes": [
            {"class_name": "Build_Factory_C", "pipe_output_connections": True},
            {"class_name": "Desc_IronPlate_C", "form": "solid"},
            {"class_name": "Recipe_IronPlate_C"}
        ]
    }
]


class TestFilterFunctions(unittest.TestCase):

    def test_filter_by_attributes_valid(self):
        """
        Test filter_by_attributes when the object contains the filtering attribute.
        """
        object_type = "Build_"
        current_object = {"class_name": "Build_Factory_C", "pipe_output_connections": True}
        filtering_attribute = "pipe_output_connections"
        objects_dict = {"Build_": []}

        # Call the method and check if the object is appended to the dictionary
        result = filter_by_attributes(object_type, current_object, filtering_attribute, objects_dict)

        # Verify that the object was returned and appended correctly
        self.assertIsNotNone(result)
        self.assertIn(current_object, objects_dict["Build_"])

    def test_filter_by_attributes_invalid(self):
        """
        Test filter_by_attributes when the object does not contain the filtering attribute.
        """
        object_type = "Build_"
        current_object = {"class_name": "Build_Factory_C"}
        filtering_attribute = "pipe_output_connections"
        objects_dict = {"Build_": []}

        # Call the method and check that None is returned
        result = filter_by_attributes(object_type, current_object, filtering_attribute, objects_dict)

        # Verify that no object was returned and nothing was appended to the dictionary
        self.assertIsNone(result)
        self.assertEqual(len(objects_dict["Build_"]), 0)

    def test_filter_objects(self):
        """
        Test filter_objects to verify that the game data is correctly filtered into supported objects.
        """
        # Call the method with mock game data
        result = filter_objects(mock_game_data)

        # Verify that the result contains the expected filtered objects
        self.assertIn("Build_", result)
        self.assertIn("Desc_", result)
        self.assertIn("Recipe_", result)

        # Check that the correct objects were added to each category
        self.assertEqual(len(result["Build_"]), 1)
        self.assertEqual(result["Build_"][0]["class_name"], "Build_Factory_C")
        self.assertEqual(len(result["Desc_"]), 1)
        self.assertEqual(result["Desc_"][0]["class_name"], "Desc_IronPlate_C")
        self.assertEqual(len(result["Recipe_"]), 1)
        self.assertEqual(result["Recipe_"][0]["class_name"], "Recipe_IronPlate_C")


import unittest


# Mock valid objects and subtype mappings to be used in tests
class TestClassifyObjectsIntoSubtypes(unittest.TestCase):

    def setUp(self):
        """
        Setup mock data and subtype mappings before each test.
        """
        # Mock valid objects to classify
        self.mock_valid_objects = {
            "Desc_": [
                {"class_name": "Desc_IronPlate_C", "key1": "value1"},
                {"class_name": "Desc_CopperPlate_C"}
            ],
            "Recipe_": [
                {"class_name": "Recipe_IronPlate_C", "key2": "value2"},
                {"class_name": "Recipe_CopperPlate_C"}
            ]
        }

        # Mock item and recipe subtypes by key attributes
        global item_subtypes_by_key_attribute, recipe_subtypes_by_key_attribute
        item_subtypes_by_key_attribute = {"key1": "Component"}
        recipe_subtypes_by_key_attribute = {"key2": "Manufacturing"}

    def test_classify_objects_into_subtypes_with_matching_keys(self):
        """
        Test that objects are correctly classified into subtypes when they have matching keys.
        """
        session = None  # Mocking session since we don't need actual DB operations

        # Call the classify_objects_into_subtypes function
        result = classify_objects_into_subtypes(session, self.mock_valid_objects)

        # Assert the classification for "Desc_" objects
        self.assertIn("Desc_", result)
        self.assertIn("Component", result["Desc_"])
        self.assertEqual(len(result["Desc_"]["Component"]), 1)
        self.assertEqual(result["Desc_"]["Component"][0]["object"]["class_name"], "Desc_IronPlate_C")

        # Assert the classification for "Recipe_" objects
        self.assertIn("Recipe_", result)
        self.assertIn("Manufacturing", result["Recipe_"])
        self.assertEqual(len(result["Recipe_"]["Manufacturing"]), 1)
        self.assertEqual(result["Recipe_"]["Manufacturing"][0]["object"]["class_name"], "Recipe_IronPlate_C")

    def test_classify_objects_into_subtypes_with_no_matching_keys(self):
        """
        Test that objects are classified as "None" when they do not have matching keys.
        """
        session = None  # Mocking session since we don't need actual DB operations

        # Call the classify_objects_into_subtypes function
        result = classify_objects_into_subtypes(session, self.mock_valid_objects)

        # Assert "None" classification for "Desc_" objects without matching keys
        self.assertIn("Desc_", result)
        self.assertIn("None", result["Desc_"])
        self.assertEqual(len(result["Desc_"]["None"]), 1)
        self.assertEqual(result["Desc_"]["None"][0]["object"]["class_name"], "Desc_CopperPlate_C")

        # Assert "None" classification for "Recipe_" objects without matching keys
        self.assertIn("Recipe_", result)
        self.assertIn("None", result["Recipe_"])
        self.assertEqual(len(result["Recipe_"]["None"]), 1)
        self.assertEqual(result["Recipe_"]["None"][0]["object"]["class_name"], "Recipe_CopperPlate_C")


import unittest
from unittest.mock import patch


# Mock valid classified objects and ORM mappings to be used in tests
class TestInsertFullyClassifiedObjects(unittest.TestCase):

    def setUp(self):
        """
        Setup mock data and ORM model mappings before each test.
        """
        # Mock classified objects to insert
        self.mock_fully_classified_objects = {
            "Desc_": {
                "Component": [
                    {"relationships": [{"table": Item, "class_name": "Desc_IronPlate_C"}],
                     "object": {"class_name": "Desc_IronPlate_C"}},
                ],
            },
            "Build_": {
                "Production": [
                    {"relationships": [{"table": Building, "class_name": "Build_Manufacturer_C"}],
                     "object": {"class_name": "Build_Manufacturer_C"}}
                ],
            },
            "Recipe_": {
                "None": [
                    {"relationships": [{"table": Recipe, "class_name": "Recipe_IronPlate_C"}],
                     "object": {"class_name": "Recipe_IronPlate_C"}}
                ],
            }
        }

        # Mock ORM model mappings for subtypes
        global item_subtypes_to_ORM_models, building_subtypes_to_ORM_models, recipe_subtypes_to_ORM_models
        item_subtypes_to_ORM_models = {"Component": Item}
        building_subtypes_to_ORM_models = {"Production": Building}
        recipe_subtypes_to_ORM_models = {"None": Recipe}

    @patch('app.insert_data.insert_objects_with_subtypes')
    @patch('app.insert_data.insert_objects_without_subtypes')
    def test_insert_fully_classified_objects_with_subtypes(self, mock_insert_objects_without_subtypes,
                                                           mock_insert_objects_with_subtypes):
        """
        Test that fully classified objects (with subtypes) are inserted correctly using insert_objects_with_subtypes.
        """
        session = None  # Mocking session

        # Call the insert_fully_classified_objects function
        insert_fully_classified_objects(session, self.mock_fully_classified_objects)

        # Assert that insert_objects_with_subtypes is called for "Desc_" items and "Build_" buildings
        mock_insert_objects_with_subtypes.assert_any_call(session,
                                                          self.mock_fully_classified_objects["Desc_"]["Component"],
                                                          Item, item_subtypes_to_ORM_models["Component"])
        mock_insert_objects_with_subtypes.assert_any_call(session,
                                                          self.mock_fully_classified_objects["Build_"]["Production"],
                                                          Building, building_subtypes_to_ORM_models["Production"])

    @patch('app.insert_data.insert_objects_with_subtypes')
    @patch('app.insert_data.insert_objects_without_subtypes')
    def test_insert_fully_classified_objects_without_subtypes(self, mock_insert_objects_without_subtypes,
                                                              mock_insert_objects_with_subtypes):
        """
        Test that fully classified recipes without subtypes are inserted using insert_objects_without_subtypes.
        """
        session = None  # Mocking session

        # Call the insert_fully_classified_objects function
        insert_fully_classified_objects(session, self.mock_fully_classified_objects)

        # Assert that insert_objects_without_subtypes is called for "Recipe_" with "None" subtype
        mock_insert_objects_without_subtypes.assert_any_call(session,
                                                             self.mock_fully_classified_objects["Recipe_"]["None"],
                                                             Recipe)


if __name__ == '__main__':
    unittest.main()
