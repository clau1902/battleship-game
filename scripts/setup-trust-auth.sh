#!/bin/bash

# Script to set up PostgreSQL trust authentication

echo "🔧 Setting up PostgreSQL Trust Authentication"
echo ""

# Common pg_hba.conf locations
LOCATIONS=(
    "/usr/local/var/postgres/pg_hba.conf"
    "$HOME/Library/Application Support/Postgres/var-*/pg_hba.conf"
    "/opt/homebrew/var/postgres/pg_hba.conf"
    "/usr/local/pgsql/data/pg_hba.conf"
    "/var/lib/postgresql/*/main/pg_hba.conf"
    "/etc/postgresql/*/main/pg_hba.conf"
)

PG_HBA_FILE=""

echo "Searching for pg_hba.conf file..."
for location in "${LOCATIONS[@]}"; do
    # Expand glob patterns
    for file in $location; do
        if [ -f "$file" ]; then
            PG_HBA_FILE="$file"
            echo "✅ Found: $PG_HBA_FILE"
            break 2
        fi
    done
done

if [ -z "$PG_HBA_FILE" ]; then
    echo "❌ Could not find pg_hba.conf automatically"
    echo ""
    echo "Please find it manually and run:"
    echo "  1. Find pg_hba.conf:"
    echo "     sudo find / -name pg_hba.conf 2>/dev/null"
    echo ""
    echo "  2. Edit the file and change:"
    echo "     local   all             all                                     md5"
    echo "     to:"
    echo "     local   all             all                                     trust"
    echo ""
    echo "  3. Also change:"
    echo "     host    all             all             127.0.0.1/32            md5"
    echo "     to:"
    echo "     host    all             all             127.0.0.1/32            trust"
    echo ""
    echo "  4. Restart PostgreSQL"
    exit 1
fi

echo ""
echo "📝 Current pg_hba.conf content (relevant lines):"
grep -E "^(local|host)" "$PG_HBA_FILE" | head -5 || echo "No local/host entries found"

echo ""
read -p "Do you want to backup and modify this file? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. You can edit the file manually: $PG_HBA_FILE"
    exit 0
fi

# Create backup
BACKUP_FILE="${PG_HBA_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$PG_HBA_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Create temporary file with modifications
TEMP_FILE=$(mktemp)
sed -E 's/^(local\s+all\s+all\s+)(md5|scram-sha-256|password)$/\1trust/' "$PG_HBA_FILE" | \
sed -E 's/^(host\s+all\s+all\s+127\.0\.0\.1\/32\s+)(md5|scram-sha-256|password)$/\1trust/' | \
sed -E 's/^(host\s+all\s+all\s+::1\/128\s+)(md5|scram-sha-256|password)$/\1trust/' > "$TEMP_FILE"

# Check if changes were made
if diff -q "$PG_HBA_FILE" "$TEMP_FILE" > /dev/null; then
    echo "⚠️  No changes needed - trust authentication may already be configured"
    rm "$TEMP_FILE"
else
    # Apply changes
    sudo cp "$TEMP_FILE" "$PG_HBA_FILE" 2>/dev/null || cp "$TEMP_FILE" "$PG_HBA_FILE"
    rm "$TEMP_FILE"
    echo "✅ Updated pg_hba.conf"
    
    echo ""
    echo "📝 Updated pg_hba.conf content (relevant lines):"
    grep -E "^(local|host)" "$PG_HBA_FILE" | head -5
fi

echo ""
echo "🔄 Restarting PostgreSQL..."
echo "   Try one of these commands:"
echo "   - brew services restart postgresql"
echo "   - brew services restart postgresql@14"
echo "   - brew services restart postgresql@15"
echo "   - brew services restart postgresql@16"
echo "   - sudo systemctl restart postgresql"
echo "   - Or restart via Postgres.app if using that"
echo ""
echo "After restarting, test the connection with:"
echo "   bun run db:test"
