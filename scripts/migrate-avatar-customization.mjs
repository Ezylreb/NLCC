#!/usr/bin/env node

import { query } from '../lib/db.js';
import * as fs from 'fs/promises';
import path from 'path';

async function migrate() {
  try {
    console.log('🚀 Starting avatar customization migration...');

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-avatar-customization.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');

    // Execute the SQL
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await query(statement);
      }
    }

    console.log('✅ Avatar customization table created successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
