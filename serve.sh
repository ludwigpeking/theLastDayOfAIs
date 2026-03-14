#!/bin/bash

# Simple HTTP server script for the Earth 3D visualization
# Serves from the parent directory so data/ is accessible

echo "🌍 Starting Earth 3D Visualization Server..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP server"
    echo "Open http://localhost:8000/earth-3d/"
    echo ""
    cd .. && python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python HTTP server"
    echo "Open http://localhost:8000/earth-3d/"
    echo ""
    cd .. && python -m http.server 8000
else
    echo "❌ Python not found. Please install Python or use another HTTP server."
    echo ""
    echo "Alternative options:"
    echo "  - Node.js: npx http-server -p 8000"
    echo "  - PHP: php -S localhost:8000"
    echo "  - VS Code: Use Live Server extension"
    exit 1
fi
