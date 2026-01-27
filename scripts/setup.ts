#!/usr/bin/env bun

/**
 * Database setup script using Drizzle
 * This script will:
 * 1. Test the database connection
 * 2. Create the database if it doesn't exist
 * 3. Run Drizzle migrations to create tables
 */

import postgres from "postgres";
import { execSync } from "child_process";

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/battleship";

// Extract database name from connection string
const dbNameMatch = connectionString.match(/\/([^/?]+)(\?|$)/);
const dbName = dbNameMatch ? dbNameMatch[1] : "battleship";

// Extract connection string without database name (to connect to postgres db)
const baseConnectionString = connectionString.replace(/\/[^/?]+(\?|$)/, "/postgres$1");

console.log("🚀 Setting up Battleship Game database with Drizzle...\n");

async function setupDatabase() {
  try {
    // Step 1: Test connection to postgres database
    console.log("1️⃣ Testing PostgreSQL connection...");
    const adminClient = postgres(baseConnectionString, { prepare: false });
    
    try {
      await adminClient`SELECT version()`;
      console.log("   ✅ PostgreSQL connection successful\n");
    } catch (error: any) {
      console.error("   ❌ Failed to connect to PostgreSQL:");
      console.error(`   Error: ${error.message}\n`);
      console.error("   Please check:");
      console.error("   - PostgreSQL is running: pg_isready");
      console.error("   - Your DATABASE_URL in .env.local is correct");
      console.error("   - PostgreSQL authentication is configured properly\n");
      process.exit(1);
    }

    // Step 2: Check if database exists, create if not
    console.log(`2️⃣ Checking if database '${dbName}' exists...`);
    const dbExists = await adminClient`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;
    
    if (dbExists.length === 0) {
      console.log(`   Database doesn't exist, creating '${dbName}'...`);
      await adminClient`CREATE DATABASE ${adminClient.unsafe(dbName)}`;
      console.log(`   ✅ Database '${dbName}' created\n`);
    } else {
      console.log(`   ✅ Database '${dbName}' already exists\n`);
    }
    
    await adminClient.end();

    // Step 3: Run Drizzle migrations
    console.log("3️⃣ Running Drizzle migrations...");
    try {
      execSync("bunx drizzle-kit push:pg", { 
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: connectionString }
      });
      console.log("   ✅ Migrations completed successfully\n");
    } catch (error: any) {
      console.error("   ❌ Migration failed:");
      console.error(`   ${error.message}\n`);
      console.error("   You can try running manually:");
      console.error("   bun run db:push\n");
      process.exit(1);
    }

    // Step 4: Verify tables were created
    console.log("4️⃣ Verifying database schema...");
    const client = postgres(connectionString, { prepare: false });
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'games'
    `;
    
    if (tables.length > 0) {
      console.log("   ✅ Games table exists\n");
    } else {
      console.log("   ⚠️  Games table not found (migration may have failed)\n");
    }
    
    await client.end();

    console.log("🎉 Database setup complete!");
    console.log("\nYou can now start the development server:");
    console.log("  bun run dev\n");

  } catch (error: any) {
    console.error("\n❌ Setup failed:");
    console.error(error.message);
    process.exit(1);
  }
}

setupDatabase();
