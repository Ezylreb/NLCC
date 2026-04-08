#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env.local');

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const parsed = dotenv.parse(envContent);
  Object.entries(parsed).forEach(([key, value]) => {
    if (!process.env[key]) process.env[key] = value;
  });
} catch (e) {
  console.log('⚠️  .env.local not found, using system environment variables');
}

dotenv.config();

// Create database connection
let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL or DATABASE_URL environment variable is not set');
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

async function query(text, params) {
  return pool.query(text, params);
}

async function migrate() {
  try {
    console.log('🚀 Starting Bahagi schema migration...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-bahagi-schema.sql');
    const sql = await fsPromises.readFile(sqlPath, 'utf-8');

    // Split and execute statements - keep multi-line comments in mind
    let statements = [];
    let currentStatement = '';
    
    const lines = sql.split('\n');
    for (const line of lines) {
      // Remove inline comments
      const commentIndex = line.indexOf('--');
      const cleanedLine = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
      const trimmed = cleanedLine.trim();
      
      // Skip empty lines
      if (trimmed === '') {
        continue;
      }
      
      currentStatement += ' ' + trimmed;
      
      // If line ends with semicolon, it's end of statement
      if (trimmed.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt && stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        console.log(
          `[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`
        );
        await query(statement);
        console.log(`  ✅ Success`);
      } catch (err) {
        // Ignore "already exists" type errors
        if (
          err.message?.includes('already exists') ||
          err.code === '42P07' ||
          err.code === 'DUPLICATE_OBJECT'
        ) {
          console.log(`  ⚠️  Skipped (already exists)`);
        } else {
          console.error(`  ❌ Error: ${err.message}`);
          throw err;
        }
      }
    }

    console.log('✅ Bahagi schema migration completed successfully!');
    console.log('\n📋 Tables created:');
    console.log('   ✓ bahagi');
    console.log('   ✓ lesson');
    console.log('   ✓ bahagi_assessment');
    console.log('   ✓ bahagi_reward');
    console.log('   ✓ lesson_progress');
    console.log('   ✓ assessment_response');
    console.log('\n🎉 You can now use the new Bahagi system!\n');
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
