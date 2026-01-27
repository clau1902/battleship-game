#!/bin/bash

# Script to configure PostgreSQL in Docker for trust authentication

echo "🐳 Configuring PostgreSQL in Docker for Trust Authentication"
echo ""

# Find PostgreSQL container
CONTAINER=$(docker ps --filter "publish=5432" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
    echo "❌ No PostgreSQL container found on port 5432"
    echo ""
    echo "Available containers:"
    docker ps --format "{{.Names}}\t{{.Ports}}" | grep -i postgres || echo "No PostgreSQL containers running"
    exit 1
fi

echo "✅ Found PostgreSQL container: $CONTAINER"
echo ""

# Find pg_hba.conf in container
echo "📝 Locating pg_hba.conf in container..."
PG_HBA_PATH=$(docker exec "$CONTAINER" find /var/lib/postgresql /usr/local/var/postgres -name "pg_hba.conf" 2>/dev/null | head -1)

if [ -z "$PG_HBA_PATH" ]; then
    # Try common locations
    for path in "/var/lib/postgresql/data/pg_hba.conf" "/usr/local/var/postgres/pg_hba.conf" "/etc/postgresql/*/main/pg_hba.conf"; do
        if docker exec "$CONTAINER" test -f "$path" 2>/dev/null; then
            PG_HBA_PATH="$path"
            break
        fi
    done
fi

if [ -z "$PG_HBA_PATH" ]; then
    echo "❌ Could not find pg_hba.conf in container"
    echo ""
    echo "Trying to find PostgreSQL data directory..."
    docker exec "$CONTAINER" psql -U postgres -c "SHOW data_directory;" 2>/dev/null || echo "Could not connect to PostgreSQL"
    exit 1
fi

echo "✅ Found pg_hba.conf at: $PG_HBA_PATH"
echo ""

echo "📋 Current configuration (relevant lines):"
docker exec "$CONTAINER" grep -E "^(local|host)" "$PG_HBA_PATH" 2>/dev/null | head -5 || echo "Could not read file"

echo ""
read -p "Do you want to configure trust authentication? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🔄 Updating pg_hba.conf..."

# Create backup inside container
docker exec "$CONTAINER" cp "$PG_HBA_PATH" "${PG_HBA_PATH}.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

# Update the file
docker exec "$CONTAINER" sed -i.bak \
    -e 's/^\(local\s\+all\s\+all\s\+\)\(md5\|scram-sha-256\|password\)$/\1trust/' \
    -e 's/^\(host\s\+all\s\+all\s\+127\.0\.0\.1\/32\s\+\)\(md5\|scram-sha-256\|password\)$/\1trust/' \
    -e 's/^\(host\s\+all\s\+all\s\+::1\/128\s\+\)\(md5\|scram-sha-256\|password\)$/\1trust/' \
    "$PG_HBA_PATH" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Updated pg_hba.conf"
    echo ""
    echo "📋 Updated configuration (relevant lines):"
    docker exec "$CONTAINER" grep -E "^(local|host)" "$PG_HBA_PATH" 2>/dev/null | head -5
    
    echo ""
    echo "🔄 Reloading PostgreSQL configuration..."
    docker exec "$CONTAINER" psql -U postgres -c "SELECT pg_reload_conf();" 2>/dev/null || {
        echo "⚠️  Could not reload config via SQL, restarting container..."
        docker restart "$CONTAINER"
        sleep 3
    }
    
    echo ""
    echo "✅ Configuration updated!"
    echo ""
    echo "Test the connection with:"
    echo "   bun run db:test"
else
    echo "❌ Failed to update pg_hba.conf"
    echo ""
    echo "You may need to:"
    echo "  1. Mount the PostgreSQL data directory as a volume"
    echo "  2. Or edit the file manually:"
    echo "     docker exec -it $CONTAINER bash"
    echo "     # Then edit $PG_HBA_PATH"
    exit 1
fi
