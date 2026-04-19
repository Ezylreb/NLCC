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
    connectionTimeoutMillis: 10000,
    query_timeout: 30000, // Query timeout set to 30 seconds
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
  retries: number = 2
): Promise<PgQueryResult<T>> {
  const pool = getConnectionPool();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await pool.query<T>(text, params);
    } catch (error: any) {
      const msg = error.message || '';
      const code = error.code || '';

      // Retryable: schema compatibility errors
      const isSchemaError = msg.includes('media_url') || msg.includes('unknown column');

      // Retryable: transient connection/timeout errors (Supabase pooler can drop idle connections)
      const isTransientError =
        msg.includes('Connection terminated') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('connection is insecure') ||
        msg.includes('timeout') ||
        msg.includes('Timeout') ||
        msg.includes('read timeout') ||
        msg.includes('Query read timeout') ||
        code === '57P01' || // admin_shutdown
        code === '57014' || // query_canceled (statement timeout)
        code === '08006' || // connection_failure
        code === '08003';   // connection_does_not_exist

      if (attempt < retries && (isSchemaError || isTransientError)) {
        console.warn(`Query attempt ${attempt + 1} failed (${isTransientError ? 'transient' : 'schema'} error: ${msg.substring(0, 80)}), retrying...`);
        continue;
      }

      // Permanent failure - throw
      console.error('Database query error:', {
        query: text.substring(0, 100),
        params: params?.slice(0, 3),
        error: msg,
        code,
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
