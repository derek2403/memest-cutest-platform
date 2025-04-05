#!/bin/bash

# Navigate to the 1inch directory
cd "$(dirname "$0")/1inch"

# Display starting message
echo "Starting 1inch bridge process..."
echo "Current directory: $(pwd)"
echo "-----------------------------------------"

# Run the Node.js script
node index.js

# Exit with the same code as the Node process
exit $? 