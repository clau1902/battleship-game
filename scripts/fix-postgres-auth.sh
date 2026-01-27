#!/bin/bash

# Script to help fix PostgreSQL authentication

echo "🔧 PostgreSQL Authentication Fix Helper"
echo ""

# Check if PostgreSQL is running
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        echo "✅ PostgreSQL is running"
    else
        echo "❌ PostgreSQL is not running"
        echo "   Start it with: brew services start postgresql"
        exit 1
    fi
else
    echo "⚠️  pg_isready not found, assuming PostgreSQL is running"
fi

echo ""
echo "To fix authentication, you have two options:"
echo ""
echo "OPTION 1: Use trust authentication (no password, local dev only)"
echo "  1. Find your pg_hba.conf file:"
echo "     - macOS Homebrew: /usr/local/var/postgres/pg_hba.conf"
echo "     - macOS Postgres.app: ~/Library/Application\\ Support/Postgres/var-*/pg_hba.conf"
echo "     - Linux: /etc/postgresql/*/main/pg_hba.conf"
echo ""
echo "  2. Edit the file and change this line:"
echo "     local   all             all                                     md5"
echo "     to:"
echo "     local   all             all                                     trust"
echo ""
echo "  3. Also change:"
echo "     host    all             all             127.0.0.1/32            md5"
echo "     to:"
echo "     host    all             all             127.0.0.1/32            trust"
echo ""
echo "  4. Restart PostgreSQL:"
echo "     brew services restart postgresql"
echo "     OR"
echo "     sudo systemctl restart postgresql"
echo ""
echo "OPTION 2: Set a password in .env.local"
echo "  1. Set a password for your PostgreSQL user:"
echo "     psql -U claudia -d postgres -c \"ALTER USER claudia PASSWORD 'yourpassword';\""
echo ""
echo "  2. Update .env.local:"
echo "     DATABASE_URL=postgresql://claudia:yourpassword@localhost:5432/battleship"
echo ""
