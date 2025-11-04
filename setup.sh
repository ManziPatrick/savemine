#!/bin/bash

# SmartMoney FRW Setup Script
echo "🚀 Setting up SmartMoney FRW..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Copy environment file
echo "📝 Setting up environment variables..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file and add your Mista API credentials:"
    echo "   - MISTA_API_KEY=your_api_key_here"
    echo "   - MISTA_SENDER_ID=your_sender_id_here"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads
mkdir -p backend/logs
echo "✅ Created uploads and logs directories"

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Seed the database
echo "🌱 Seeding database with sample data..."
docker-compose exec backend npm run seed

echo ""
echo "🎉 SmartMoney FRW setup complete!"
echo ""
echo "📍 Services running:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:5000"
echo "   • API Documentation: http://localhost:5000/api-docs"
echo "   • MongoDB: localhost:27017"
echo ""
echo "📱 Sample accounts created:"
echo "   • john@example.com / password123"
echo "   • jane@example.com / password123"
echo "   • admin@smartmoney.com / admin123"
echo ""
echo "📞 Test phone numbers for SMS:"
echo "   • Alice Mukamana: +250788111222"
echo "   • Bob Uwimana: +250788333444"
echo "   • Charlie Nkurunziza: +250788555666"
echo ""
echo "🔧 To stop services: docker-compose down"
echo "📊 To view logs: docker-compose logs -f"
echo ""
echo "Happy coding! 🚀"


