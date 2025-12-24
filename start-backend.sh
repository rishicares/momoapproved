#!/bin/bash

# Navigate to backend directory
cd backend

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Load environment variables from root .env if it exists
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Also check frontend/.env since the user placed creds there
if [ -f ../frontend/.env ]; then
  export $(grep -v '^#' ../frontend/.env | xargs)
fi

# Start the server
python server.py