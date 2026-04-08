import { Pool } from 'pg';

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Add libpqcompat for SSL compatibility with Supabase
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
