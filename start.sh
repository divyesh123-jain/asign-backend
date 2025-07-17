#!/bin/bash

echo "Starting Polling Application Backend..."
echo "=================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting server on port 4000..."
node server.js 