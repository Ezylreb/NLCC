/**
 * Unified Database Connection Manager
 * Single pool instance with connection pooling and health checks
 */

import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';

let connectionPool: Pool | null = null;

/**
 * Initialize the database connection pool
 */
export function initializeConnectionPool(): Pool {
  if (connectionPool) {
    return connectionPool;
  }

  let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  // Add libpqcompat for SSL compatibility with Supabase
  if (connectionString && !connectionString.includes('uselibpqcompat')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
  }

  connectionPool = new Pool({
    connectionString: connectionString,
    ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  connectionPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return connectionPool;
}

/**
 * Get the connection pool (lazy initialization)
 */
export function getConnectionPool(): Pool {
  return connectionPool || initializeConnectionPool();
}

/**
 * Execute a query with automatic retries and error handling
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[],
  retries: number = 1
): Promise<PgQueryResult<T>> {
  const pool = getConnectionPool();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await pool.query<T>(text, params);
    } catch (error: any) {
      // Schema compatibility - try fallback query
      if (attempt < retries && (error.message?.includes('media_url') || error.message?.includes('unknown column'))) {
        // Log but continue to fallback
        console.warn(`Query attempt ${attempt + 1} failed with schema error, retrying...`);
        continue;
      }

      // Permanent failure - throw
      console.error('Database query error:', {
        query: text.substring(0, 100),
        params: params?.slice(0, 3),
        error: error.message,
        attempt: attempt + 1,
      });

      throw error;
    }
  }

  throw new Error('Query failed after all retries');
}

/**
 * Get a client from the pool (for transactions)
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getConnectionPool();
  return pool.connect();
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check - verify connection is working
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const pool = getConnectionPool();
    const result = await pool.query('SELECT NOW()');
    return result.rowCount === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close all connections (for graceful shutdown)
 */
export async function closeConnections(): Promise<void> {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
  }
}

export default {
  getConnectionPool,
  initializeConnectionPool,
  query,
  getClient,
  transaction,
  healthCheck,
  closeConnections,
};
