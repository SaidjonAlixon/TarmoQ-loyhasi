import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Fix SSL certificate issue for Railway
let connectionString = process.env.DATABASE_URL;
// Remove sslmode from connection string if present, we'll handle it in Pool config
if (connectionString.includes('sslmode')) {
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/, '');
  // Clean up any double ? or &
  connectionString = connectionString.replace(/\?&/, '?').replace(/&&/, '&');
  if (connectionString.endsWith('?') || connectionString.endsWith('&')) {
    connectionString = connectionString.slice(0, -1);
  }
}

export const pool = new Pool({ 
  connectionString,
  // Disable SSL verification for Railway proxy to fix certificate mismatch
  ssl: connectionString.includes('railway') ? { 
    rejectUnauthorized: false
  } : undefined
});
export const db = drizzle(pool, { schema });
