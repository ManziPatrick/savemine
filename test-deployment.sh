#!/bin/bash

# Test script for Vercel deployments

echo "🧪 Testing SmartMoney FRW Deployment"
echo "===================================="
echo ""

# Get URLs from user
read -p "Enter Frontend URL: " FRONTEND_URL
read -p "Enter Backend URL: " BACKEND_URL

echo ""
echo "Testing Backend..."
echo "=================="

# Test health endpoint
echo "1. Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    echo "✅ Health check passed"
    echo "Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi

echo ""

# Test API documentation
echo "2. Testing /api-docs endpoint..."
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api-docs")
if [ "$DOCS_STATUS" = "200" ]; then
    echo "✅ API docs accessible"
else
    echo "❌ API docs not accessible (Status: $DOCS_STATUS)"
fi

echo ""

# Test CORS
echo "3. Testing CORS configuration..."
CORS_HEADERS=$(curl -s -I -X OPTIONS -H "Origin: $FRONTEND_URL" "$BACKEND_URL/health" | grep -i "access-control")
if [ ! -z "$CORS_HEADERS" ]; then
    echo "✅ CORS headers present"
    echo "$CORS_HEADERS"
else
    echo "⚠️  CORS headers not found"
fi

echo ""
echo "Testing Frontend..."
echo "==================="

# Test frontend loads
echo "4. Testing frontend loads..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend loads successfully"
else
    echo "❌ Frontend failed to load (Status: $FRONTEND_STATUS)"
fi

echo ""
echo "5. Testing API connectivity from frontend..."
echo "   (Check browser console for any CORS or API errors)"

echo ""
echo "📋 Manual Testing Checklist:"
echo "============================="
echo "□ Open frontend URL in browser"
echo "□ Check browser console for errors"
echo "□ Try to register a new user"
echo "□ Try to login with registered user"
echo "□ Test API calls (loans, contacts, etc.)"
echo "□ Check that data persists in database"
echo ""

echo "✅ Testing complete!"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

