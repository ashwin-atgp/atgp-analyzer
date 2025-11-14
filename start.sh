#!/bin/bash

# Ad Stack Analyzer Startup Script

echo "🚀 Ad Stack Analyzer - Starting Setup"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

# Install Puppeteer browser if needed
echo ""
echo "🌐 Checking Puppeteer browser..."
npx puppeteer browsers install chrome

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

# Start services
echo ""
echo "🎯 Starting services..."
echo "======================================"

# Start backend
echo "Starting backend on port 5001..."
cd ../backend
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend on port 3000..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 5

echo ""
echo "======================================"
echo "✨ Ad Stack Analyzer is running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5001"
echo ""
echo "To stop the services, press Ctrl+C"
echo "======================================"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID
