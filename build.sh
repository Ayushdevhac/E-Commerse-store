#!/bin/bash

# Vercel Build Script
echo "🚀 Starting Vercel build process..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm ci --only=production

# Build frontend
echo "🔨 Building frontend..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Frontend built to: frontend/dist"
echo "🌐 Backend will run as serverless function"
