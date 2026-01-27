import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/battleship";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    console.log("Connection string:", connectionString.replace(/:[^:@]+@/, ":****@"));
    
    const client = postgres(connectionString, { prepare: false });
    
    // Test basic connection
    const result = await client`SELECT version()`;
    console.log("✅ Database connection successful!");
    console.log("PostgreSQL version:", result[0]?.version);
    
    // Check if games table exists
    const tableCheck = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'games'
      );
    `;
    
    if (tableCheck[0]?.exists) {
      console.log("✅ Games table exists!");
    } else {
      console.log("❌ Games table does NOT exist. Run: bun run db:push");
    }
    
    await client.end();
  } catch (error: any) {
    console.error("❌ Database connection failed:");
    console.error("Error:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Make sure PostgreSQL is running: pg_isready");
    console.error("2. Create the database: createdb battleship");
    console.error("3. Check your DATABASE_URL in .env.local");
    process.exit(1);
  }
}

testConnection();
