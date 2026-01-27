#!/bin/bash

# Script to set up Docker PostgreSQL for battleship game

echo "🐳 Setting up Docker PostgreSQL for Battleship Game"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "✅ Using: $DOCKER_COMPOSE"
echo ""

# Start the container
echo "🚀 Starting PostgreSQL container..."
$DOCKER_COMPOSE up -d

if [ $? -eq 0 ]; then
    echo "✅ Container started successfully"
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if $DOCKER_COMPOSE exec -T postgres pg_isready -U battleship &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ PostgreSQL failed to start after 30 seconds"
            exit 1
        fi
        sleep 1
        echo -n "."
    done
    echo ""
    echo ""
    echo "📊 Container status:"
    $DOCKER_COMPOSE ps
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Run migrations: bun run db:push"
    echo "  2. Test connection: bun run db:test"
    echo "  3. Start dev server: bun run dev"
    echo ""
    echo "To stop the container:"
    echo "  $DOCKER_COMPOSE down"
    echo ""
    echo "To view logs:"
    echo "  $DOCKER_COMPOSE logs -f postgres"
else
    echo "❌ Failed to start container"
    exit 1
fi
