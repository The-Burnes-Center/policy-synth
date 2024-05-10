#!/bin/bash

# Check if an entry key was provided
if [ $# -eq 0 ]; then
    echo "Usage: ./run_test_json.shh <entry_key>"
    exit 1
fi

ENTRY_KEY="$1"
PYTHON_SCRIPT="test_json.py"

# Replace the entry key in the Python script
sed -i "s/entry_key = \".*\"/entry_key = \"$ENTRY_KEY\"/" $PYTHON_SCRIPT

# Run the deepeval test run command
deepeval test run $PYTHON_SCRIPT
