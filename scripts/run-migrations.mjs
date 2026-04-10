#!/usr/bin/env node

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database connection
let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL or DATABASE_URL environment variable not set');
  process.exit(1);
}

// Add libpqcompat for SSL compatibility with Supabase
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...\n');
    
    const migrationFiles = [
      'scripts/migrate-student-teacher-relationship.sql',
      'scripts/migrate-student-class-relationship.sql'
    ];
    
    for (const migrationFile of migrationFiles) {
      const filePath = path.join(__dirname, migrationFile);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${migrationFile} - file not found`);
        continue;
      }
      
      console.log(`📄 Running: ${migrationFile}`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        await pool.query(sql);
        console.log(`✅ Completed: ${migrationFile}\n`);
      } catch (error) {
        console.error(`❌ Failed: ${migrationFile}`);
        console.error(`   Error: ${error.message}\n`);
      }
    }
    
    // Verify columns exist
    console.log('🔍 Verifying migration...');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('teacher_id', 'class_id')
      ORDER BY column_name
    `);
    
    if (result.rows.length >= 1) {
      console.log('✅ Database migration completed successfully!\n');
      console.log('Columns in users table:');
      result.rows.forEach(row => {
        console.log(`  • ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️  Columns may not have been created properly.');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
