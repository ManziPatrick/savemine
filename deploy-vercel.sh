#!/bin/bash

# Vercel Deployment Script
# This script helps deploy both frontend and backend to Vercel

echo "🚀 SmartMoney FRW - Vercel Deployment Script"
echo "==========================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Function to deploy backend
deploy_backend() {
    echo "📦 Deploying Backend..."
    cd backend
    
    echo "Setting up environment variables..."
    echo "Please enter your MongoDB URI:"
    read -r MONGODB_URI
    vercel env add MONGODB_URI production <<< "$MONGODB_URI"
    
    echo "Enter JWT Secret:"
    read -r JWT_SECRET
    vercel env add JWT_SECRET production <<< "$JWT_SECRET"
    
    echo "Enter JWT Expires In (default: 7d):"
    read -r JWT_EXPIRES_IN
    JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
    vercel env add JWT_EXPIRES_IN production <<< "$JWT_EXPIRES_IN"
    
    echo "Enter Mista API Key (optional):"
    read -r MISTA_API_KEY
    if [ ! -z "$MISTA_API_KEY" ]; then
        vercel env add MISTA_API_KEY production <<< "$MISTA_API_KEY"
    fi
    
    echo "Enter Mista Sender ID (optional):"
    read -r MISTA_SENDER_ID
    if [ ! -z "$MISTA_SENDER_ID" ]; then
        vercel env add MISTA_SENDER_ID production <<< "$MISTA_SENDER_ID"
    fi
    
    vercel env add MISTA_API_URL production <<< "https://api.mista.io"
    vercel env add NODE_ENV production <<< "production"
    
    echo ""
    echo "Deploying to Vercel..."
    vercel --prod
    
    BACKEND_URL=$(vercel ls | grep -o 'https://[^ ]*' | head -1)
    echo ""
    echo "✅ Backend deployed at: $BACKEND_URL"
    echo ""
    
    cd ..
    echo "$BACKEND_URL" > .backend_url
}

# Function to deploy frontend
deploy_frontend() {
    echo "📦 Deploying Frontend..."
    
    BACKEND_URL=$(cat .backend_url 2>/dev/null || echo "")
    
    if [ -z "$BACKEND_URL" ]; then
        echo "Enter backend URL (e.g., https://your-backend.vercel.app):"
        read -r BACKEND_URL
    fi
    
    cd frontend
    
    echo "Setting VITE_API_URL to: $BACKEND_URL/api"
    vercel env add VITE_API_URL production <<< "$BACKEND_URL/api"
    
    echo ""
    echo "Deploying to Vercel..."
    vercel --prod
    
    FRONTEND_URL=$(vercel ls | grep -o 'https://[^ ]*' | head -1)
    echo ""
    echo "✅ Frontend deployed at: $FRONTEND_URL"
    echo ""
    
    cd ..
}

# Main menu
echo "What would you like to deploy?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both (Backend first, then Frontend)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        deploy_frontend
        echo ""
        echo "🎉 Deployment complete!"
        echo ""
        echo "Backend URL: $(cat .backend_url)"
        echo "Frontend URL: Check Vercel dashboard or run 'vercel ls' in frontend directory"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📝 Next steps:"
echo "1. Test your backend: curl $(cat .backend_url 2>/dev/null || echo '<backend-url>')/health"
echo "2. Open your frontend URL in a browser"
echo "3. Test user registration and login"
echo ""
echo "For troubleshooting, see VERCEL_DEPLOYMENT.md"

