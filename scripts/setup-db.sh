#!/bin/bash

# Setup script for Battleship Game database

echo "Setting up Battleship Game database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not set. Using default: postgresql://localhost:5432/battleship"
    export DATABASE_URL="postgresql://localhost:5432/battleship"
fi

# Extract database name from connection string
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -z "$DB_NAME" ]; then
    DB_NAME="battleship"
fi

echo "Creating database: $DB_NAME"

# Try to create the database (will fail if it already exists, which is fine)
createdb "$DB_NAME" 2>/dev/null || echo "Database may already exist, continuing..."

echo "Running Drizzle migrations..."
bunx drizzle-kit push

echo "Database setup complete!"
