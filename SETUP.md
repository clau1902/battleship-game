# Quick Setup Guide

## Fix the 500 Error

The error occurs because the database isn't set up yet. Follow these steps:

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the project root with your PostgreSQL connection string:

```bash
# Option 1: If you have a PostgreSQL password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/battleship

# Option 2: If using trust authentication (no password)
DATABASE_URL=postgresql://postgres@localhost:5432/battleship

# Option 3: Using your system username
DATABASE_URL=postgresql://$(whoami)@localhost:5432/battleship
```

### Step 2: Create the database

```bash
# Create the battleship database
createdb battleship

# Or if that doesn't work, use psql:
psql -U postgres -c "CREATE DATABASE battleship;"
```

### Step 3: Run database migrations

```bash
# This will create the games table
bun run db:push
```

### Step 4: Restart the dev server

```bash
# Stop the current server (Ctrl+C) and restart
bun run dev
```

## Troubleshooting

### If you get "password authentication failed":

1. **Check PostgreSQL is running:**
   ```bash
   pg_isready
   ```

2. **Try connecting manually:**
   ```bash
   psql -U postgres -d battleship
   ```

3. **If you need to set up trust authentication** (for local development only):
   - Edit PostgreSQL config: `/usr/local/var/postgres/pg_hba.conf` (macOS) or `/etc/postgresql/*/main/pg_hba.conf` (Linux)
   - Change `md5` to `trust` for local connections
   - Restart PostgreSQL: `brew services restart postgresql` or `sudo systemctl restart postgresql`

### If you get "relation 'games' does not exist":

Run the migration:
```bash
bun run db:push
```

### Test your setup:

```bash
bun run db:test
```

This will verify your database connection and check if the table exists.
