#!/bin/bash

#####################################################################
# Pydantic to TypeScript Type Generator
#
# This script watches the Python models in the 'py' directory
# and automatically generates a TypeScript index.ts file when changes
# are detected in any Python file. The types are generated from the
# models defined or imported in __init__.py.
#
# You can run this script in two ways:
#
# 1. Directly from the command line:
#    $ ./src/models/watch.sh
#
# 2. As a VSCode task:
#    - Open the Command Palette (Ctrl+Shift+P)
#    - Type "Tasks: Run Task"
#    - Select "Watch Pydantic Models and Generate TypeScript"
#
# Dependencies:
# - pydantic-to-typescript package
# - inotify-tools (for efficient file watching on Linux)
#####################################################################

# Set the directories to watch and output to
PY_DIR="$(dirname "$0")/py"
TS_DIR="$(dirname "$0")/ts"

# Make sure the output directory exists
mkdir -p "$TS_DIR"

# Function to generate TypeScript files from Pydantic models in __init__.py
generate_typescript() {
    echo "Generating TypeScript types from Pydantic models..."
    
    # Check if __init__.py exists
    if [ ! -f "$PY_DIR/__init__.py" ]; then
        echo "No __init__.py found in $PY_DIR"
        return
    fi
    
    # Generate TypeScript file from the main module
    echo "Processing module: __init__.py"
    
    # Use pydantic-to-typescript to generate types
    # We need to provide the module path and output file
    pydantic2ts --module "$PY_DIR/__init__.py" --output "$TS_DIR/index.ts"
    
    echo "TypeScript generation complete!"
}

# Initial generation
generate_typescript

# Watch for changes
echo "Watching $PY_DIR directory for changes..."
while true; do
    changes=$(inotifywait -r -e create,modify,delete,move "$PY_DIR" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "Changes detected: $changes"
        generate_typescript
    else
        # If inotifywait is not available, use a simple polling mechanism
        echo "inotifywait not found, falling back to polling every 5 seconds"
        sleep 5
        generate_typescript
    fi
done
