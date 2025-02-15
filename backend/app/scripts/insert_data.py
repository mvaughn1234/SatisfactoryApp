"""
insert_data.py

This script processes data from a JSON file related to a game and inserts it into a PostgreSQL database using SQLAlchemy ORM models. It handles various types of objects such as buildings, items, and recipes, establishing relationships between these entities and managing their insertion into the database.

### Features:

1. **Data Loading**:
   - The script loads a JSON file (e.g., `data/en-US.json`) which contains game data such as buildings, items, and recipes.
   - Data is typed and converted as necessary using utility functions like `load_json_file` and `convert_data_types`.

2. **Filtering and Classification**:
   - Filters game objects to include in the database, currently focusing on production buildings, items, and recipes.
   - The script classifies objects into subtypes (e.g., extractors for buildings, or sinkables for items).

3. **Relationship Management**:
   - Manages the relationships between objects such as recipes, buildings, and items.
   - Recipes are linked to their respective input ingredients, output products, and compatible buildings.

4. **Database Insertion**:
   - Inserts classified objects into the PostgreSQL database using SQLAlchemy ORM models such as `Building`, `Item`, `Recipe`, and others.
   - Utilizes a session-based approach to manage database transactions and ensure efficient data insertion.

5. **Table Management**:
   - Includes functionality to truncate specific database tables and restart their identities, cascading deletions on dependent tables where necessary.

### Key Functions:

1. **truncate_tables(session: Session)**:
   - Truncates selected tables (e.g., `alien_power_fuels`, `sinkables`, `consumables`, etc.) and restarts their identities.
   - Uses a cascading strategy to ensure all dependent data is properly deleted.

### Models Involved:

- **Building**: Represents buildings in the game with attributes such as production boosts, power consumption, etc.
- **Item**: Represents different types of items used in the game, including fuels, sinkables, and consumables.
- **Recipe**: Represents crafting recipes, including the ingredients (inputs) and products (outputs), as well as the buildings compatible with producing the items.

### Example Usage:

```python
# Example function to insert data into the database
def insert_data(session: Session):
    # Load data from JSON
    game_data = load_json_file(game_data_file_path)

    # Classify and filter game objects (buildings, items, recipes)
    buildings = classify_buildings(game_data)
    items = classify_items(game_data)
    recipes = classify_recipes(game_data)

    # Insert data into the database
    session.add_all(buildings)
    session.add_all(items)
    session.add_all(recipes)
    session.commit()

# Example usage of the truncate_tables function
with Session(engine) as session:
    truncate_tables(session)

Requirements:
SQLAlchemy ORM: The script uses SQLAlchemy's ORM to interact with the PostgreSQL database.
Database Configuration: Ensure the database is properly configured in the Config class.

less
This documentation outlines the purpose of the script, describes its main features, and includes examples of how key functions are used. It also references the associated SQLAlchemy models for buildings, items, and recipes. Let me know if you need any additional details or modifications! &#8203;:contentReference[oaicite:0]{index=0}&#8203;

"""
import re

from sqlalchemy import create_engine, text
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session, sessionmaker, aliased

from app.models import Item, AlienPowerFuel, Component, Sinkable, Consumable, NuclearFuel, PowerShard, RawResource, \
    Building, \
    Manufacturer, Extractor, Recipe, RecipeInputs, RecipeOutputs, RecipeCompatibleBuildings, Smelter
from app.scripts.adjust_recipe_amounts_for_fluids import UpdateLiquids
from app.utils import load_json_file, convert_data_types
from config import Config

game_data_file_path = "data/en-US.json"


def truncate_tables(session: Session):
    """
    Truncates specified tables in the PostgreSQL database and restarts their identities.
    Cascading is applied to dependent tables to ensure all related records are also deleted.

    Parameters:
    - session (Session): SQLAlchemy database session used to execute the truncate statements.

    Returns:
    None
    """
    truncate_statements = [
        "truncate table alien_power_fuels restart identity cascade;",
        "truncate table sinkables restart identity cascade;",
        "truncate table consumables restart identity cascade;",
        "truncate table extractors restart identity cascade;",
        "truncate table manufacturers restart identity cascade;",
        "truncate table nuclear_fuels restart identity cascade;",
        "truncate table power_shards restart identity cascade;",
        "truncate table raw_resources restart identity cascade;",
        "truncate table recipe_compatible_buildings restart identity cascade;",
        "truncate table recipe_inputs restart identity cascade;",
        "truncate table recipe_outputs restart identity cascade;",
        "truncate table smelters restart identity cascade;",
        "truncate table components restart identity cascade;",
        "truncate table buildings restart identity cascade;",
        "truncate table production_line_targets restart identity cascade;",
        "truncate table items restart identity cascade;",
        "truncate table production_lines restart identity cascade;",
        "truncate table user_recipes restart identity cascade;",
        "truncate table recipes restart identity cascade;",
        "truncate table users restart identity cascade;",
    ]
    # truncate_statements = [
    #     "truncate table alien_power_fuels restart identity cascade;",
    #     "truncate table components restart identity cascade;",
    #     "truncate table sinkables restart identity cascade;",
    #     "truncate table consumables restart identity cascade;",
    #     "truncate table extractors restart identity cascade;",
    #     "truncate table manufacturers restart identity cascade;",
    #     "truncate table nuclear_fuels restart identity cascade;",
    #     "truncate table power_shards restart identity cascade;",
    #     "truncate table raw_resources restart identity cascade;",
    #     "truncate table recipe_compatible_buildings restart identity cascade;",
    #     "truncate table recipe_inputs restart identity cascade;",
    #     "truncate table recipe_outputs restart identity cascade;",
    #     "truncate table items restart identity cascade;",
    #     "truncate table recipes restart identity cascade;",
    #     "truncate table smelters restart identity cascade;",
    #     "truncate table buildings restart identity cascade;"
    # ]
    #
    for statement in truncate_statements:
        session.execute(text(statement))

    session.commit()  # Commit after all truncates
    print("All tables truncated and identities restarted.")


building_subtypes = {
    "Build_FrackingExtractor_C": "Extractor",
    "Build_MinerMk2_C": "Extractor",
    "Build_MinerMk1_C": "Extractor",
    "Build_MinerMk3_C": "Extractor",
    "Build_OilPump_C": "Extractor",
    "Build_WaterPump_C": "Extractor",
    "Build_AssemblerMk1_C": "Manufacturer",
    "Build_Blender_C": "Manufacturer",
    "Build_ConstructorMk1_C": "Manufacturer",
    "Build_Converter_C": "Manufacturer",
    "Build_HadronCollider_C": "Manufacturer",
    "Build_ManufacturerMk1_C": "Manufacturer",
    "Build_OilRefinery_C": "Manufacturer",
    "Build_Packager_C": "Manufacturer",
    "Build_QuantumEncoder_C": "Manufacturer",
    "Build_FoundryMk1_C": "Smelter",
    "Build_SmelterMk1_C": "Smelter"
}

item_subtypes_by_key_attribute = {
    "extra_potential": "PowerShard",
    "boost_duration": "AlienPowerFuel",
    "resource_sink_points": "Sinkable",
    "custom_hands_mesh_scale": "Consumable",
    "amount_of_waste": "NuclearFuel",
    "collect_speed_multiplier": "RawResource"
}

item_subtypes_to_ORM_models = {
    "AlienPowerFuel": AlienPowerFuel,
    "Sinkable": Sinkable,
    "Consumable": Consumable,
    "NuclearFuel": NuclearFuel,
    "PowerShard": PowerShard,
    "RawResource": RawResource,
    "None": None
}

building_subtypes_to_ORM_models = {
    "Extractor": Extractor,
    "Manufacturer": Manufacturer,
    "Smelter": Smelter,
    "None": None
}

recipe_subtypes_by_key_attribute = {
    "input_quantity": "RecipeInputs",
    "output_quantity": "RecipeOutputs",
    "is_produced_in_building": "RecipeCompatibleBuildings"
}

recipe_subtypes_to_ORM_models = {
    "RecipeInputs": RecipeInputs,
    "RecipeOutputs": RecipeOutputs,
    "RecipeCompatibleBuildings": RecipeCompatibleBuildings,
    "None": None
}

table_name_to_ORM_models = {
    "items": Item,
    "recipes": Recipe,
    "buildings": Building
}


# Setup engine and session independent of the app
def setup_db():
    """
    Sets up the database connection by creating an engine and establishing a session factory.
    This function configures the connection to the PostgreSQL database.

    Returns:
    None
    """
    # Create an engine using the database URI from the config
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

    # Create a configured "Session" class
    Session = sessionmaker(bind=engine)

    # Return the session and engine for use
    return Session(), engine


def remove_optional_s(word):
    """
    Removes the optional 's' character from specific words in the data (likely related to
    object classifications). This function is used to ensure consistency in the data.

    Returns:
    None
    """
    if word.endswith('s'):
        return word[:-1]  # Remove the last character
    return word


def parse_recipe_data(session: Session, recipe_object):
    """
    Parses the recipe data from the loaded JSON file. This function likely processes
    recipe-related information such as inputs, outputs, and manufacturing details.

    Returns:
    None
    """
    recipe_ingredients = []
    recipe_products = []
    recipe_buildings = []

    r_ingredients = re.compile(r'([A-Za-z0-9_]+)\.([A-Za-z0-9_]+_C)\'",Amount=(\d+)')
    r_products = r_ingredients
    r_buildings = re.compile(r'([A-Za-z0-9_]+)\.([A-Za-z0-9_]+_C)"')

    if "ingredients" in recipe_object and recipe_object["ingredients"]:
        for match in r_ingredients.finditer(recipe_object["ingredients"]):
            class_name = match.group(2)
            amount = match.group(3)
            recipe_ingredients.append({"recipeInputs_item": class_name, "amount": amount})

    if "product" in recipe_object and recipe_object["product"]:
        for match in r_products.finditer(recipe_object["product"]):
            class_name = match.group(2)
            amount = match.group(3)
            recipe_products.append({"recipeOutputs_item": class_name, "amount": amount})

    if "produced_in" in recipe_object and recipe_object["produced_in"]:
        for match in r_buildings.finditer(recipe_object["produced_in"]):
            class_name = match.group(2)
            if class_name in building_subtypes.keys():
                recipe_buildings.append({"recipeCompatibleBuilding_building": class_name})

    return (recipe_ingredients, recipe_products, recipe_buildings)


def populate_components_table(session):
    """
    Re-populates the component table with Items that:
    - Are related to recipe_outputs for recipes that have a non-null building_id in the RecipeCompatibleBuildings table.
    - Have non-null resource_sink_points in the Items table
    - Are not produced from recipes that have related_events: related_events must be null.
    :param session: SQLAlchemy session used for database interactions.
    :return: None
    """

    # Alias for certified components
    certified_components = aliased(Item)

    # Query to gather all the necessary components
    components = (
        session.query(Sinkable, Recipe, RecipeCompatibleBuildings, Building, certified_components)
        .join(certified_components,
              certified_components.id == Sinkable.item_id)  # Join Sinkable with certified_components
        .join(RecipeOutputs, RecipeOutputs.item_id == Sinkable.item_id)  # Join RecipeOutputs based on item_id
        .join(Recipe, RecipeOutputs.recipe_id == Recipe.id)  # Join Recipe based on recipe_id
        .join(RecipeCompatibleBuildings,
              RecipeCompatibleBuildings.recipe_id == Recipe.id)  # Join RecipeCompatibleBuildings
        .join(Building, Building.id == RecipeCompatibleBuildings.building_id)  # Join Building
        .filter((Recipe.relevant_events.is_(None)) | (Recipe.relevant_events != "(EV_Christmas)"))  # Filter events
        .filter(RecipeCompatibleBuildings.building_id.isnot(None))  # Ensure building_id is not null
        .filter(Sinkable.resource_sink_points.isnot(None))  # Ensure resource_sink_points is not null
    ).all()  # Retrieve all the results

    component_rows = []

    # Iterate over the query result
    for sinkable, recipe, recipe_building, building, item in components:
        component_rows.append({
            'item_id': sinkable.item_id,
            'building_id': building.id,
            'recipe_id': recipe.id,
            'recipe_type': 'standard' if recipe.display_name == item.display_name else (
                'alternate' if (recipe.display_name.startswith('Alternate') and not recipe.display_name.endswith(
                    recipe.display_name)) else (
                    'alternate' if recipe.display_name.startswith('Alternate') else 'byproduct')),
        })

    # Insert the rows into the components table
    for component_row in component_rows:
        new_component = Component(
            item_id=component_row['item_id'],
            building_id=component_row['building_id'],
            recipe_id=component_row['recipe_id'],
            recipe_type=component_row['recipe_type']
        )
        session.add(new_component)

    # Commit the changes to the database
    session.commit()


def insert_subtype_object(session, object_to_insert, subclass, subclass_columns, relationships):
    """
    Inserts a subtype object into the database by filtering the relevant attributes for the subtype
    and establishing relationships with the parent object or other related objects.

    :param session: SQLAlchemy session used for database interactions.
    :param object_to_insert: A dictionary containing the object's data.
    :param subclass: The SQLAlchemy model class representing the subtype.
    :param subclass_columns: A set of columns that belong to the subtype model.
    :param relationships: A list of relationships to establish with the parent object or other related objects.
                          Each relationship can be either an object or a dictionary with "table" and "class_name".
    :return: A new instance of the subtype class.
    """

    # Filter the object data to include only the attributes that belong to the subtype
    subtype_data = {key: value for key, value in object_to_insert.items() if key in subclass_columns}

    # Establish relationships between the subtype and the parent object or other related objects
    for relationship in relationships:
        existing_item = relationship
        # If the relationship is a dictionary, query the related object from the database
        if isinstance(relationship, dict):
            existing_item = session.query(relationship["table"]).filter_by(
                class_name=relationship["class_name"]).first()

        if existing_item is not None:
            # Establish the relationship by adding the related object to the subtype's data
            subtype_data[remove_optional_s(existing_item.__tablename__)] = existing_item

    # Create and return a new instance of the subtype class with the filtered data and relationships
    subtype_new_object = subclass(**subtype_data)
    return subtype_new_object


def insert_objects_with_subtypes(session: Session, object_list, main_class, sub_class):
    """
    Inserts a list of objects that have specific subtypes into the database.
    The method dynamically handles inserting into the main class and its respective subtypes.

    :param session: SQLAlchemy session used for database interactions.
    :param object_list: List of objects, where each object is a dictionary containing "object" and "relationships".
    :param main_class: The main SQLAlchemy model class for the object (e.g., Item, Building).
    :param sub_class: The SQLAlchemy model class representing the subtype (e.g., Sinkable, AlienPowerFuel).
    :return: None
    """

    # Get the column names of the main class and the subtype class (if provided)
    main_columns = {col.name for col in inspect(main_class).columns}
    sub_columns = {}
    if sub_class is not None:
        sub_columns = {col.name for col in inspect(sub_class).columns}

    # Iterate through each object in the object list
    for object_with_relationship_data in object_list:
        try:
            object_data = object_with_relationship_data["object"]
            relationship_data = object_with_relationship_data["relationships"]

            # Extract only the attributes that belong to the main class
            main_data = {key: value for key, value in object_data.items() if key in main_columns}

            # Check if the object already exists in the database
            existing_item = session.query(main_class).filter_by(class_name=object_data['class_name']).first()

            if not existing_item:
                # Create a new instance of the main class
                main_object = main_class(**main_data)
                session.add(main_object)  # Add the object to the session
            else:
                main_object = existing_item

            # If the object has attributes that belong to the subtype, insert the subtype object
            if any(key in object_data for key in sub_columns):
                sub_object = insert_subtype_object(session, object_data, sub_class, sub_columns, relationship_data)
                session.add(sub_object)  # Add the subtype object to the session

        except Exception as e:
            print(f"Error inserting object: {e}")
        finally:
            continue  # Continue processing the next object

    # Commit the session to save all changes to the database
    session.commit()


def insert_objects_without_subtypes(session: Session, object_list, main_class):
    """
    Inserts a list of objects into the database when no subtypes are involved.
    The method filters attributes relevant to the main class and bulk inserts the objects.

    :param session: SQLAlchemy session used for database interactions.
    :param object_list: List of objects (dictionaries) to be inserted.
    :param main_class: The main SQLAlchemy model class for the object (e.g., Item, Recipe).
    :return: None
    """

    main_objects_to_insert = []

    # Inspect the main class to retrieve its column names
    main_columns = {col.name for col in inspect(main_class).columns}

    # Iterate over the list of objects
    for object_data in object_list:
        # Filter the object data to include only the attributes belonging to the main class
        main_data = {key: value for key, value in object_data.items() if key in main_columns}

        # Create an instance of the main class using the filtered data
        main_object = main_class(**main_data)
        main_objects_to_insert.append(main_object)

    # Bulk insert the main objects into the database
    session.bulk_save_objects(main_objects_to_insert)

    # Commit the changes to the database
    session.commit()


def insert_fully_classified_objects(session: Session, fully_classified_objects):
    """
    Inserts fully classified objects (items, buildings, and recipes) into the database.
    Depending on the object type and subtype, the insertion is handled using either
    `insert_objects_with_subtypes` or `insert_objects_without_subtypes`.

    :param session: SQLAlchemy session used to interact with the database.
    :param fully_classified_objects: A dictionary of classified objects, keyed by main class
                                     names (e.g., "Desc_", "Build_", "Recipe_") and their subtypes.
    :return: None
    """

    # Insert "Desc_" items (e.g., sinkables, fuels, etc.)
    main_class_name = "Desc_"
    for item_subtype in fully_classified_objects[main_class_name].keys():
        insert_objects_with_subtypes(
            session,
            fully_classified_objects[main_class_name][item_subtype],
            Item,
            item_subtypes_to_ORM_models[item_subtype]
        )

    # Insert "Build_" buildings (e.g., production buildings)
    main_class_name = "Build_"
    for build_subtype in fully_classified_objects[main_class_name].keys():
        insert_objects_with_subtypes(
            session,
            fully_classified_objects[main_class_name][build_subtype],
            Building,
            building_subtypes_to_ORM_models[build_subtype]
        )

    # Insert "Recipe_" recipes
    main_class_name = "Recipe_"
    if len(fully_classified_objects[main_class_name].keys()) == 1:
        # If there's only one recipe subtype, use insert_objects_without_subtypes
        insert_objects_without_subtypes(
            session,
            fully_classified_objects[main_class_name]["None"],
            Recipe
        )
    else:
        # Otherwise, insert recipes by subtype
        for recipe_subtype in fully_classified_objects[main_class_name].keys():
            insert_objects_with_subtypes(
                session,
                fully_classified_objects[main_class_name][recipe_subtype],
                Recipe,
                recipe_subtypes_to_ORM_models[recipe_subtype]
            )


def append_recipe_object_with_production_relationships(recipe, recipe_ingredients, recipe_products, recipe_buildings):
    """Takes in a recipe, along with recipe ingredients, recipe outputs and recipe buildings to create individual
    recipe objects for each one of those items so they can all be inserted individually into the database"""
    recipe_objects_extended = []

    if recipe_ingredients:
        for recipe_ingredient in recipe_ingredients:
            recipe_extended_object = recipe.copy()
            recipe_extended_object["item"] = recipe_ingredient["recipeInputs_item"]
            recipe_extended_object["input_quantity"] = recipe_ingredient["amount"]
            recipe_objects_extended.append(recipe_extended_object)

    if recipe_products:
        for recipe_product in recipe_products:
            recipe_extended_object = recipe.copy()
            recipe_extended_object["item"] = recipe_product["recipeOutputs_item"]
            recipe_extended_object["output_quantity"] = recipe_product["amount"]
            recipe_objects_extended.append(recipe_extended_object)

    if recipe_buildings:
        for recipe_building in recipe_buildings:
            recipe_extended_object = recipe.copy()
            recipe_extended_object["building"] = recipe_building["recipeCompatibleBuilding_building"]
            recipe_extended_object["is_produced_in_building"] = True
            recipe_objects_extended.append(recipe_extended_object)

    else:
        recipe_extended_object = recipe.copy()
        recipe_extended_object["is_produced_in_building"] = False
        recipe_objects_extended.append(recipe_extended_object)

    return recipe_objects_extended


def classify_objects_into_subtypes(session: Session, valid_objects):
    """
    Classifies valid objects into subtypes based on predefined attributes and keys.
    It processes different object types (like 'Desc_' for items and 'Recipe_' for recipes)
    and organizes them into subcategories. Relationships between objects and database
    tables (e.g., Item, Recipe) are also tracked.

    :param session: SQLAlchemy session for interacting with the database.
    :param valid_objects: Dictionary of valid objects to classify, keyed by object type.
                          Example: {"Desc_": [...], "Recipe_": [...]}
    :return: A dictionary of subclassified objects, organized by object type and subtype.
    """
    subclassified_objects = {}

    # Iterate over each type of object in the valid objects dictionary
    for object_type in valid_objects.keys():
        match object_type:

            # Classification logic for "Desc_" (Items)
            case "Desc_":
                desc_objects = valid_objects[object_type]
                for item in desc_objects:
                    # Find common keys between the object and the item subtypes
                    matching_keys = set(item.keys()).intersection(set(item_subtypes_by_key_attribute.keys()))

                    if matching_keys:
                        # If matching keys are found, classify the item by subtype
                        for key in matching_keys:
                            sub_type = item_subtypes_by_key_attribute[key]
                            item_with_relationships = {
                                "relationships": [{"table": Item, "class_name": item["class_name"]}],
                                "object": item
                            }
                            # Add the item to the subclassified objects under the correct subtype
                            if "Desc_" in subclassified_objects:
                                if sub_type in subclassified_objects["Desc_"]:
                                    subclassified_objects["Desc_"][sub_type].append(item_with_relationships)
                                else:
                                    subclassified_objects["Desc_"][sub_type] = [item_with_relationships]
                            else:
                                subclassified_objects["Desc_"] = {sub_type: [item_with_relationships]}
                    else:
                        # Items that do not match any subtype are classified as "None"
                        sub_type = "None"
                        item_with_relationships = {
                            "relationships": [{"table": Item, "class_name": item["class_name"]}],
                            "object": item
                        }
                        if "Desc_" in subclassified_objects:
                            if sub_type in subclassified_objects["Desc_"]:
                                subclassified_objects["Desc_"][sub_type].append(item_with_relationships)
                            else:
                                subclassified_objects["Desc_"][sub_type] = [item_with_relationships]
                        else:
                            subclassified_objects["Desc_"] = {sub_type: [item_with_relationships]}

            # Classification logic for "Build_" (Buildings)
            case "Build_":
                build_objects = valid_objects[object_type]
                for building in build_objects:
                    matching_values = set(building.values()).intersection(set(building_subtypes.keys()))
                    if matching_values:
                        value = next(iter(matching_values))
                        if value in building_subtypes:
                            sub_type = building_subtypes[value]
                            building_with_relationships = {
                                "relationships": [{"table": Building, "class_name": building["class_name"]}],
                                "object": building
                            }
                            if "Build_" in subclassified_objects:
                                if sub_type in subclassified_objects["Build_"]:
                                    subclassified_objects["Build_"][sub_type].append(building_with_relationships)
                                else:
                                    subclassified_objects["Build_"][sub_type] = [building_with_relationships]
                            else:
                                subclassified_objects["Build_"] = {sub_type: [building_with_relationships]}
                    else:
                        sub_type = "None"
                        building_with_relationships = {
                            "relationships": [{"table": Building, "class_name": building["class_name"]}],
                            "object": building
                        }
                        if "Build_" in subclassified_objects:
                            if sub_type in subclassified_objects["Build_"]:
                                subclassified_objects["Build_"][sub_type].append(building_with_relationships)
                            else:
                                subclassified_objects["Build_"][sub_type] = [building_with_relationships]
                        else:
                            subclassified_objects["Build_"] = {sub_type: [building_with_relationships]}

            # Classification logic for "Recipe_" (Recipes)
            case "Recipe_":
                recipe_objects = valid_objects[object_type]
                for recipe in recipe_objects:
                    recipe_ingredients, recipe_products, recipe_buildings = parse_recipe_data(session, recipe)
                    if recipe_ingredients or recipe_products or recipe_buildings:
                        recipe_objects_extended = append_recipe_object_with_production_relationships(recipe,
                                                                                                     recipe_ingredients,
                                                                                                     recipe_products,
                                                                                                     recipe_buildings)
                        for extended_recipe_object in recipe_objects_extended:
                            matching_keys = set(extended_recipe_object.keys()).intersection(
                                set(recipe_subtypes_by_key_attribute.keys()))
                            if matching_keys:
                                for key in matching_keys:
                                    sub_type = recipe_subtypes_by_key_attribute[key]
                                    if sub_type == "RecipeInputs" or sub_type == "RecipeOutputs":
                                        extended_recipe_with_relationships = {
                                            "relationships": [
                                                {"table": Recipe, "class_name": extended_recipe_object["class_name"]},
                                                {"table": Item, "class_name": extended_recipe_object["item"]},
                                            ],
                                            "object": extended_recipe_object
                                        }
                                    elif sub_type == "RecipeCompatibleBuildings":
                                        if "building" in extended_recipe_object:
                                            extended_recipe_with_relationships = {
                                                "relationships": [
                                                    {"table": Recipe,
                                                     "class_name": extended_recipe_object["class_name"]},
                                                    {"table": Building,
                                                     "class_name": extended_recipe_object["building"]},
                                                ],
                                                "object": extended_recipe_object
                                            }
                                        else:
                                            extended_recipe_with_relationships = {
                                                "relationships": [
                                                    {"table": Recipe,
                                                     "class_name": extended_recipe_object["class_name"]},
                                                ],
                                                "object": extended_recipe_object
                                            }
                                    else:
                                        extended_recipe_with_relationships = {
                                            "relationships": [
                                                {"table": Recipe, "class_name": extended_recipe_object["class_name"]},
                                            ],
                                            "object": extended_recipe_object
                                        }
                                    if "Recipe_" in subclassified_objects:
                                        if sub_type in subclassified_objects["Recipe_"]:
                                            subclassified_objects["Recipe_"][sub_type].append(
                                                extended_recipe_with_relationships)
                                        else:
                                            subclassified_objects["Recipe_"][sub_type] = [
                                                extended_recipe_with_relationships]
                                    else:
                                        subclassified_objects["Recipe_"] = {
                                            sub_type: [extended_recipe_with_relationships]}
                    else:
                        sub_type = "None"
                        recipe_with_relationships = {
                            "relationships": [
                                {"table": Recipe, "class_name": recipe["class_name"]},
                            ],
                            "object": recipe
                        }

                        if "Recipe_" in subclassified_objects:
                            if sub_type in subclassified_objects["Recipe_"]:
                                subclassified_objects["Recipe_"][sub_type].append(recipe_with_relationships)
                            else:
                                subclassified_objects["Recipe_"][sub_type] = [recipe_with_relationships]
                        else:
                            subclassified_objects["Recipe_"] = {sub_type: [recipe_with_relationships]}

    return subclassified_objects


def filter_by_attributes(object_type: str, current_object: dict, filtering_attribute: str, objects_dict=None):
    """
    Validates whether an object is supported within the database based on a defining attribute `filtering_attribute`.
    If the object contains this attribute, it is considered valid and either appended to the `objects_dict`
    (if provided) or returned directly.

    :param object_type: Prefix of the object type (e.g., "Build_", "Desc_", "Recipe_").
    :param current_object: A dictionary representing an object from the game data with attributes including "class_name".
    :param filtering_attribute: A string representing the attribute within the object that this function checks to
                                determine its validity.
    :param objects_dict: Optional dictionary of the form {"<Object Type Prefix>": [<object>]} that keeps track of valid
                         objects. If provided, valid objects are appended to this dictionary.
    :return: The `current_object` if it is valid (i.e., contains the `filtering_attribute`), otherwise `None`.
    """

    # Initialize the valid_object as None, meaning not valid by default
    valid_object = None

    # Check if the current object contains the required filtering attribute
    if filtering_attribute in current_object.keys():
        valid_object = current_object  # Mark the object as valid

        # If objects_dict is provided, append the valid object to the corresponding list
        if objects_dict is not None:
            objects_dict[object_type].append(valid_object)

    # Return the valid object if found, otherwise None
    return valid_object


def filter_objects(game_data_json):
    """
    Filters the `game_data_json` into a list of objects that are supported by this app's database.
    The supported objects typically include buildings, items, and recipes based on specific prefixes
    like "Build_", "Desc_", and "Recipe_". Additionally, the function applies filters to select only
    production-related buildings and valid items or recipes.

    :param game_data_json: List of dictionaries, where each dictionary contains data for various objects
                           in the format [{"NativeClass": "NativeClass", "Classes": [<Classes>]}].
    :return: dict -- A dictionary where keys represent object type prefixes (e.g., "Build_", "Desc_", "Recipe_")
                     and values are lists of objects corresponding to these types.
    """
    supported_objects = {}
    supported_object_types = set()

    for native_class in game_data_json:
        classes = native_class["classes"]
        for potential_object in classes:
            class_name = potential_object["class_name"]

            # Filter Building objects
            if class_name.startswith("Build_"):
                # Only include production-related buildings
                filtering_attribute = "pipe_output_connections"
                valid_object = filter_by_attributes("Build_", potential_object, filtering_attribute)
                if valid_object is not None:
                    if "Build_" not in supported_object_types:
                        supported_object_types.add("Build_")
                        supported_objects["Build_"] = [valid_object]
                    else:
                        supported_objects["Build_"].append(valid_object)

            # Filter Recipe objects
            elif class_name.startswith("Recipe_"):
                # All recipes are valid
                if "Recipe_" not in supported_object_types:
                    supported_object_types.add("Recipe_")
                    supported_objects["Recipe_"] = [potential_object]
                else:
                    supported_objects["Recipe_"].append(potential_object)

            # Filter Item objects
            else:
                filtering_attribute = "form"
                valid_object = filter_by_attributes("Desc_", potential_object, filtering_attribute)
                if valid_object is not None:
                    if "Desc_" not in supported_object_types:
                        supported_object_types.add("Desc_")
                        supported_objects["Desc_"] = [valid_object]
                    else:
                        supported_objects["Desc_"].append(valid_object)

    return supported_objects


def initialize_database():
    """
    Initializes the database by processing game data, filtering supported objects, and inserting them
    into the PostgreSQL database. It also handles truncating tables before the insertion.

    This function performs the following steps:
    1. Loads game data from a JSON file.
    2. Converts the data types (using utility functions like `convert_data_types`).
    3. Filters supported objects such as items, buildings, and recipes.
    4. Truncates existing tables in the database.
    5. Classifies the filtered objects into subtypes.
    6. Inserts the fully classified objects into the database.
    7. Commits the transaction and handles any errors during insertion.

    :return: None
    """
    game_data = load_json_file(game_data_file_path)
    game_data_json = convert_data_types(game_data, snakify_key=True)
    supported_objects_list = filter_objects(game_data_json)
    # Set up the database session
    session, engine = setup_db()
    try:
        truncate_tables(session)
        fully_classified_objects = classify_objects_into_subtypes(session, supported_objects_list)
        # Perform the database insertions using session
        insert_fully_classified_objects(session, fully_classified_objects)

        # Commit the changes
        session.commit()

        UpdateLiquids.adjust_recipe_amounts_for_fluids()

        print("Data inserted successfully!")

        populate_components_table(session)
        print("Components successfully populated!")


    except Exception as e:
        session.rollback()  # Rollback if any error occurs
        print(f"Error during insertion: {e}")
    finally:
        session.close()  # Close the session

#
# if __name__ == "__main__":
#     initialize_database()
