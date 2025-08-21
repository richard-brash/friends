#!/bin/bash

# Friends CRM Deployment Script
echo "🚀 Building Friends CRM for deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm ci
npm run build

# Copy build to backend public directory  
echo "📂 Copying frontend build to backend..."
rm -rf ../backend/public
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm ci --only=production

echo "✅ Build complete! Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git add . && git commit -m 'Production build' && git push"
echo "2. Deploy to DigitalOcean App Platform using the GitHub repository"
echo "3. Set NODE_ENV=production and PORT=4000 in environment variables"
echo ""
echo "Or run locally with: npm run prod"
