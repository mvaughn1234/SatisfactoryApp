"""
./app/utils.py
A utility module where you can store helper functions that are used across different parts of your app.

These could include:

Data validation functions.
Formatting or data transformation functions.
Helper methods for common tasks (e.g., converting units).
"""
import json
import os
import re

import chardet

from contextlib import contextmanager
from app.models.base import SessionLocal

@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

# Load json data in from file
def load_json_file(file_path):
    # Ensure file exists at specified path
    if os.path.exists(file_path) is None:
        print("File not found")
        return None

    # Try opening the file as utf-8
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            json_str = file.read()
    except UnicodeDecodeError:
        # If utf-8 fails, use chardet to detect encoding
        with open(file_path, 'rb') as file:
            raw_data = file.read()
            result = chardet.detect(raw_data)
            encoding = result['encoding']
            print(f"Detected encoding: {encoding}")


        with open(file_path, 'r', encoding=encoding) as file:
            json_str = file.read()

    try:
        json_data = json.loads(json_str)
        print("JSON Loaded Successfully")
        return json_data
    except json.JSONDecodeError as e:
        print(f"Error parsing json: {e}")
        return None
    except UnicodeDecodeError as e:
        print(f"Error: failed to decode the file using {encoding}. {str(e)}")
        return None


def get_column_type(value):
    """Determine the PostgreSQL column type based on the value."""
    if isinstance(value, bool):
        return "BOOLEAN"
    elif isinstance(value, int):
        return "INTEGER"
    elif isinstance(value, float):
        return "FLOAT"
    elif isinstance(value, list):
        return "JSONB"  # Store lists and arrays as JSONB
    elif isinstance(value, dict):
        return "JSONB"  # Store nested dictionaries as JSONB
    else:
        return "TEXT"


def attempt_cast(value):
    """Attempt to cast the value to the appropriate type (int, float, bool)."""
    if isinstance(value, str):
        # Check for booleans
        if value.lower() == 'true':
            return True
        elif value.lower() == 'false':
            return False

        # Try to convert to a number (int or float)
        try:
            if '.' in value:
                return float(value)  # Convert to float if there's a decimal point
            else:
                return int(value)  # Convert to int if it's a whole number
        except ValueError:
            # If it's not a number, return the original string
            return value
    else:
        # If it's not a string, return the value as-is
        return value


# Precompile regex patterns for performance
prefix_pattern = re.compile(r'^[a-z](?:_|(?=[A-Z]))')  # Updated regex to stop after matching the prefix
split_pattern = re.compile(r'[A-Z]+(?=[A-Z][a-z])|[A-Z][a-z]+|[a-z]+|[A-Z]+|[0-9]+')

def to_snake_case(key: str) -> str:
    if key == "mWaterpumpTimeline_RTPC_B8FA6F944E717E3B7A286E84901F620E":
        key = "mWaterpumpTimeline_RTPC"
    elif key == "mWaterpumpTimeline__Direction_B8FA6F944E717E3B7A286E84901F620E":
        key = "mWaterpumpTimeline__Direction"
    # Step 1: Strip the prefixes (corrected to preserve the first letter of the word)
    key = prefix_pattern.sub('', key)

    # Step 2: Split into words based on the defined pattern
    words = split_pattern.findall(key)

    # Step 3: Convert to lowercase and join with underscores
    snake_case_key = '_'.join(map(str.lower, words))

    return snake_case_key


def convert_data_types(data: object, snakify_key: bool=False) -> object:
    """Recursively convert data types in a JSON object."""
    if isinstance(data, dict):
        if snakify_key:
            return {to_snake_case(key): convert_data_types(value, snakify_key) for key, value in data.items()}
        else:
            return {key: convert_data_types(value, snakify_key) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_data_types(value, snakify_key) for value in data]
    else:
        return attempt_cast(data)

def print_model_from_data(json_data):
    for key, value in json_data:
        value_type = attempt_cast(value)
        print(f"{key}: Mapped[Optional[{value_type}]")
