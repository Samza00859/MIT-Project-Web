#!/bin/bash

# Function to kill processes on script exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT SIGTERM

echo "Starting TradingAgents Development Environment..."

# Start Backend
echo "Starting Backend (Port 8000)..."
cd backend
# Check if python3 is available, else try python
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
else
    PYTHON_CMD=python
fi
$PYTHON_CMD start_api.py &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend (Port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID