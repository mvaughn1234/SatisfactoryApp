#!/bin/bash

# Define directories to exclude from the file structure output
EXCLUDE_DIRS="--prune -I '(.venv|.idea|node_modules|__python_env__|.git)'"

# Check if 'tree' is installed
if ! command -v tree &> /dev/null
then
    echo "The 'tree' command is not installed. Install it using your package manager (e.g., apt, yum, brew)."
    exit
fi

# Run the 'tree' command, excluding the specified directories
tree -a $EXCLUDE_DIRS
