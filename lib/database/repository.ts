/**
 * Generic Repository Pattern
 * Unified CRUD operations for all entities
 */

import { query, transaction, getClient } from './connection';
import type { QueryResult, RepositoryOptions } from './types';

/**
 * Generic Repository for database operations
 */
export class Repository<T extends Record<string, any> = any> {
  constructor(private tableName: string) {}

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    const paramId = typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id, 10) : id;
    const result = await query<T>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [paramId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(options?: RepositoryOptions): Promise<T[]> {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (options?.where && Object.keys(options.where).length > 0) {
      const conditions = Object.entries(options.where)
        .map(([key, value]) => {
          if (value === null) return `${key} IS NULL`;
          params.push(value);
          if (Array.isArray(value)) return `${key} = ANY($${params.length})`;
          return `${key} = $${params.length}`;
        })
        .join(' AND ');
      sql += ` WHERE ${conditions}`;
    }

    if (options?.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options?.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    const result = await query<T>(sql, params);
    return result.rows;
  }

  /**
   * Count records
   */
  async count(where?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.entries(where)
        .map(([key], idx) => `${key} = $${idx + 1}`)
        .join(' AND ');
      sql += ` WHERE ${conditions}`;
    }

    const result = await query<{ count: string }>(sql, Object.values(where || {}));
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data).filter(k => (data as any)[k] !== undefined);
    const values = keys.map(k => (data as any)[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');

    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(',')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await query<T>(sql, values);
    return result.rows[0];
  }

  /**
   * Update record by ID
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    // Ensure numeric IDs are passed as numbers for correct pg type binding
    const paramId = typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id, 10) : id;
    const keys = Object.keys(data).filter(k => (data as any)[k] !== undefined);
    if (keys.length === 0) {
      return this.findById(id);
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(',');
    const values = [...keys.map(k => (data as any)[k]), paramId];

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;

    const result = await query<T>(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Delete record (soft delete via is_archived column if exists)
   */
  async delete(id: string | number, soft: boolean = true): Promise<boolean> {
    // Ensure numeric IDs are passed as numbers for correct pg type binding
    const paramId = typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id, 10) : id;

    if (soft) {
      // Try soft delete first
      try {
        const softResult = await query(
          `UPDATE ${this.tableName} SET is_archived = true, updated_at = NOW() WHERE id = $1`,
          [paramId]
        );
        return (softResult.rowCount || 0) > 0;
      } catch {
        // Fall through to hard delete if soft delete not supported
      }
    }

    // Hard delete
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [paramId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Upsert (create or update)
   */
  async upsert(
    uniqueKey: string,
    data: Partial<T>,
    onConflictUpdate: Partial<T> | null = null
  ): Promise<T> {
    const keys = Object.keys(data).filter(k => (data as any)[k] !== undefined);
    const values = keys.map(k => (data as any)[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');

    const updateClause = onConflictUpdate
      ? Object.keys(onConflictUpdate)
          .map((key, i) => `${key} = $${keys.length + i + 1}`)
          .join(',')
      : keys.map(k => `${k} = EXCLUDED.${k}`).join(',');

    const allValues = [
      ...values,
      ...(onConflictUpdate ? Object.values(onConflictUpdate).filter(v => v !== undefined) : []),
    ];

    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(',')})
      VALUES (${placeholders})
      ON CONFLICT (${uniqueKey}) DO UPDATE SET ${updateClause}
      RETURNING *
    `;

    const result = await query<T>(sql, allValues);
    return result.rows[0];
  }

  /**
   * Batch insert
   */
  async batchCreate(dataArray: Partial<T>[]): Promise<T[]> {
    if (dataArray.length === 0) return [];

    const keys = Object.keys(dataArray[0]).filter(k => (dataArray[0] as any)[k] !== undefined);
    const values: any[] = [];
    const placeholders: string[] = [];

    dataArray.forEach((data, rowIdx) => {
      const rowPlaceholders = keys
        .map((key, colIdx) => {
          const paramIdx = rowIdx * keys.length + colIdx + 1;
          values.push((data as any)[key]);
          return `$${paramIdx}`;
        })
        .join(',');
      placeholders.push(`(${rowPlaceholders})`);
    });

    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(',')})
      VALUES ${placeholders.join(',')}
      RETURNING *
    `;

    const result = await query<T>(sql, values);
    return result.rows;
  }

  /**
   * Execute raw query
   */
  async raw<U extends Record<string, any> = any>(sql: string, params?: any[]): Promise<U[]> {
    const result = await query<U>(sql, params);
    return result.rows;
  }

  /**
   * Execute within transaction
   */
  async executeInTransaction<U>(callback: (repo: this) => Promise<U>): Promise<U> {
    return transaction(() => callback(this));
  }
}

/**
 * Factory function to create repositories
 */
export function createRepository<T extends Record<string, any> = any>(tableName: string): Repository<T> {
  return new Repository<T>(tableName);
}

// Pre-created repositories for common entities
export const repositories = {
  bahagi: createRepository('bahagi'),
  lesson: createRepository('lesson'),
  assessment: createRepository('bahagi_assessment'),
  answer: createRepository('yunit_answers'),
  reward: createRepository('student_rewards'),
  trophy: createRepository('trophies'),
  user: createRepository('users'),
  preferences: createRepository('preferences'),
};

export default {
  Repository,
  createRepository,
  repositories,
};
