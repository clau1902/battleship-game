import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Build connection string with proper defaults
const getConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Try to build a connection string from individual components
  const user = process.env.DB_USER || process.env.USER || "postgres";
  const password = process.env.DB_PASSWORD || "";
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const database = process.env.DB_NAME || "battleship";
  
  if (password) {
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }
  
  // Try without password (trust authentication)
  return `postgresql://${user}@${host}:${port}/${database}`;
};

// Lazy initialization to avoid issues during build
let clientInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (!clientInstance) {
    const connectionString = getConnectionString();
    clientInstance = postgres(connectionString, { 
      prepare: false,
      onnotice: () => {}, // Suppress notices
    });
  }
  return clientInstance;
}

function getDb() {
  // For development, use a global variable to preserve the connection across HMR
  if (process.env.NODE_ENV === "development") {
    let globalWithDb = global as typeof globalThis & {
      _db?: ReturnType<typeof drizzle>;
      _client?: ReturnType<typeof postgres>;
    };

    if (!globalWithDb._client) {
      const connectionString = getConnectionString();
      globalWithDb._client = postgres(connectionString, { 
        prepare: false,
        onnotice: () => {},
      });
    }

    if (!globalWithDb._db) {
      globalWithDb._db = drizzle(globalWithDb._client, { schema });
    }
    return globalWithDb._db;
  } else {
    if (!dbInstance) {
      dbInstance = drizzle(getClient(), { schema });
    }
    return dbInstance;
  }
}

// Export the db instance directly
const db = getDb();
export default db;

