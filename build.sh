#!/bin/bash

echo "🔨 Building Agricultural Dataset Generator..."

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🏗️ Building frontend..."
npm run build

echo "✅ Build complete! Frontend built to frontend/dist"
