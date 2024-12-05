import re

# Precompile regex patterns for performance
prefix_pattern = re.compile(r'^[a-z](?:_|(?=[A-Z]))')  # Updated regex to stop after matching the prefix
split_pattern = re.compile(r'[A-Z]+(?=[A-Z][a-z])|[A-Z][a-z]+|[a-z]+|[A-Z]+|[0-9]+')


def to_snake_case(key: str) -> str:
    # Step 1: Strip the prefixes (corrected to preserve the first letter of the word)
    key = prefix_pattern.sub('', key)

    # Step 2: Split into words based on the defined pattern
    words = split_pattern.findall(key)

    # Step 3: Convert to lowercase and join with underscores
    snake_case_key = '_'.join(map(str.lower, words))

    return snake_case_key


# Test cases
keys = [
    'mPowerConsumption',  # Expect: power_consumption
    'ClassName',  # Expect: class_name
    'bigOverlapList',  # Expect: big_overlap_list
    'bForceLegacyBuildEffect',  # Expect: force_legacy_build_effect
    'mStartVector_VFX_Small_Start',  # Expect: start_vector_vfx_small_start
    'mIsPendingToKillVFX'  # Expect: is_pending_to_kill_vfx
]

# Apply the conversion to all the example keys
converted_keys = [to_snake_case(key) for key in keys]

print([key for key in converted_keys])
