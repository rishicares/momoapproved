#!/bin/bash
# Deployment script for production server

set -e  # Exit on error

echo "🚀 Deploying to production..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# 2. Show current .env file
echo "📋 Current .env contents:"
cat frontend/.env

# 3. Stop containers
echo "🛑 Stopping containers..."
docker-compose down

# 4. Rebuild without cache (CRITICAL!)
echo "🔨 Rebuilding Docker images (this may take a few minutes)..."
docker-compose build --no-cache

# 5. Start containers
echo "▶️  Starting containers..."
docker-compose up -d

# 6. Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# 7. Verify services are running
echo "✅ Checking services..."
docker-compose ps

# 8. Test backend directly
echo "🧪 Testing backend API..."
curl -s http://localhost:3000/api/list-images | head -n 10 || echo "Backend not responding yet"

# 9. Show logs
echo "📝 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "✨ Deployment complete!"
echo "🌐 Visit: http://momo.rishikesh.info.np"
echo ""
echo "💡 If browser still shows old code:"
echo "   1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "   2. Or open in Incognito/Private window"
echo "   3. Clear browser cache"
