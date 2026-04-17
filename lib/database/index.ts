/**
 * Unified Database Module
 * Central export point for all database utilities
 */

export * from './types';
export * from './connection';
export * from './repository';
export * from './storage';

// Re-export key functions at module level for convenience
import { query, transaction, getClient, healthCheck, closeConnections } from './connection';
import { Repository, createRepository, repositories } from './repository';
import * as storage from './storage';

export const db = {
  query,
  transaction,
  getClient,
  healthCheck,
  closeConnections,
  createRepository,
  repositories,
  storage,
};

export default db;
