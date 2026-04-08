#!/usr/bin/env node

// Migration script to fix classes table schema
import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });

const { Pool } = pg;

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL or DATABASE_URL not set');
  process.exit(1);
}

// Add libpqcompat for SSL compatibility
if (!connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  console.log('🔄 Starting classes table migration...\n');

  const client = await pool.connect();

  try {
    // Step 1: Check if classes table exists
    console.log('📝 Checking classes table...');
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='classes'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('  Creating classes table from scratch...');
      await client.query(`
        CREATE TABLE classes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          is_archived BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ classes table created');
    } else {
      console.log('  ✅ classes table exists');
      
      // Check and add missing columns
      const columns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='classes'
      `);
      
      const existingColumns = columns.rows.map(r => r.column_name);
      console.log(`  Found columns: ${existingColumns.join(', ')}`);
      
      // Add teacher_id if missing
      if (!existingColumns.includes('teacher_id')) {
        console.log('  Adding teacher_id column...');
        await client.query(`
          ALTER TABLE classes ADD COLUMN teacher_id UUID
        `);
        console.log('  ✅ Added teacher_id column');
      }
      
      // Add is_archived if missing
      if (!existingColumns.includes('is_archived')) {
        console.log('  Adding is_archived column...');
        await client.query(`
          ALTER TABLE classes ADD COLUMN is_archived BOOLEAN DEFAULT FALSE
        `);
        console.log('  ✅ Added is_archived column');
      }
      
      // Add updated_at if missing
      if (!existingColumns.includes('updated_at')) {
        console.log('  Adding updated_at column...');
        await client.query(`
          ALTER TABLE classes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('  ✅ Added updated_at column');
      }
    }
    
    // Step 2: Create indexes for better performance
    console.log('\n📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_classes_is_archived ON classes(is_archived)
    `);
    console.log('  ✅ Indexes created');
    
    // Step 3: Ensure foreign key constraint
    console.log('\n📝 Verifying foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE classes
        ADD CONSTRAINT fk_classes_teacher_id 
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('  ✅ Foreign key constraint verified');
    } catch (fkError) {
      if (fkError.message.includes('already exists')) {
        console.log('  ✅ Foreign key constraint already exists');
      } else {
        console.warn('  ⚠️  Could not add foreign key:', fkError.message);
      }
    }

    console.log('\n✨ Migration completed successfully!\n');
    
    // Summary
    const classCount = await client.query('SELECT COUNT(*) FROM classes');
    console.log('📊 Database Summary:');
    console.log(`  Classes: ${classCount.rows[0].count}\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) console.error('   Details:', error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
