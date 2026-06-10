import { Pool } from "pg";

// Use a singleton pattern to avoid creating multiple pools in dev mode (HMR)
const globalForPg = globalThis as unknown as { pgPool: Pool | undefined };

const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Supabase
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export default pool;
