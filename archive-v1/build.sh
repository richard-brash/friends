#!/bin/bash

# Restore hidden package.json file
echo "Restoring frontend package.json..."
cd frontend
if [ -f "package.json.tmp" ]; then
  mv package.json.tmp package.json
fi

# Build frontend
echo "Building frontend..."
npm ci
npm run build

# Setup backend
echo "Setting up backend..."
cd ../backend
npm ci

# Copy frontend build to backend public
echo "Copying frontend build to backend..."
mkdir -p public
cp -r ../frontend/dist/* public/

echo "Build complete!"
