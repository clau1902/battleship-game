#!/usr/bin/env bun

/**
 * Diagnostic script to check PostgreSQL connection chain
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";

console.log("🔍 Checking PostgreSQL Connection Chain\n");

// Step 1: Check environment variables
console.log("1️⃣ Environment Variables:");
console.log("   NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("   DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Not set");
if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@");
  console.log("   Connection string:", masked);
} else {
  console.log("   DB_USER:", process.env.DB_USER || "not set");
  console.log("   DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "not set");
  console.log("   DB_HOST:", process.env.DB_HOST || "not set");
  console.log("   DB_PORT:", process.env.DB_PORT || "not set");
  console.log("   DB_NAME:", process.env.DB_NAME || "not set");
}
console.log();

// Step 2: Build connection string (same logic as lib/db.ts)
function getConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const user = process.env.DB_USER || process.env.USER || "postgres";
  const password = process.env.DB_PASSWORD || "";
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const database = process.env.DB_NAME || "battleship";
  
  if (password) {
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }
  
  return `postgresql://${user}@${host}:${port}/${database}`;
}

const connectionString = getConnectionString();
const maskedConnection = connectionString.replace(/:[^:@]+@/, ":****@");
console.log("2️⃣ Connection String:");
console.log("   Using:", maskedConnection);
console.log();

// Step 3: Test raw postgres connection
console.log("3️⃣ Testing raw postgres connection...");
try {
  const client = postgres(connectionString, { 
    prepare: false,
    onnotice: () => {},
  });
  
  const result = await client`SELECT version()`;
  console.log("   ✅ Raw postgres connection successful");
  console.log("   PostgreSQL version:", result[0]?.version?.substring(0, 50) + "...");
  await client.end();
} catch (error: any) {
  console.error("   ❌ Raw postgres connection failed:");
  console.error("   Error:", error.message);
  console.error("   Code:", error.code);
  console.error("   Details:", error.details);
  process.exit(1);
}
console.log();

// Step 4: Test Drizzle connection
console.log("4️⃣ Testing Drizzle connection...");
try {
  const client = postgres(connectionString, { 
    prepare: false,
    onnotice: () => {},
  });
  
  const db = drizzle(client, { schema });
  
  // Try a simple query using Drizzle
  const result = await client`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  
  console.log("   ✅ Drizzle connection successful");
  console.log("   Tables found:", result.length);
  if (result.length > 0) {
    console.log("   Table names:", result.map((r: any) => r.table_name).join(", "));
  }
  
  await client.end();
} catch (error: any) {
  console.error("   ❌ Drizzle connection failed:");
  console.error("   Error:", error.message);
  console.error("   Code:", error.code);
  process.exit(1);
}
console.log();

// Step 5: Check if games table exists
console.log("5️⃣ Checking games table...");
try {
  const client = postgres(connectionString, { 
    prepare: false,
    onnotice: () => {},
  });
  
  const db = drizzle(client, { schema });
  
  const tableCheck = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'games'
    )
  `;
  
  const exists = (tableCheck[0] as any)?.exists;
  if (exists) {
    console.log("   ✅ Games table exists");
    
    // Check table structure
    const columns = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'games'
      ORDER BY ordinal_position
    `;
    console.log("   Columns:", columns.length);
  } else {
    console.log("   ❌ Games table does NOT exist");
    console.log("   Run: bun run db:push");
  }
  
  await client.end();
} catch (error: any) {
  console.error("   ❌ Error checking games table:");
  console.error("   Error:", error.message);
  process.exit(1);
}
console.log();

console.log("✅ Connection chain check complete!");

