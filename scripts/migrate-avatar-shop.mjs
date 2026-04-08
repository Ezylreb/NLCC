#!/usr/bin/env node

import { query } from '../lib/db.js';
import * as fs from 'fs/promises';
import path from 'path';

async function migrate() {
  try {
    console.log('🚀 Starting avatar shop migration...');

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-avatar-shop.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');

    // Execute statements
    const statements = sql
      .split(';')
      .filter(s => s.trim())
      .map(s => s.trim() + ';');

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      try {
        await query(statement);
      } catch (error: any) {
        // Ignore "column already exists" type errors
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`  ⚠️  Skipped: ${error.message.substring(0, 40)}`);
      }
    }

    console.log('✅ Avatar shop tables created successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
