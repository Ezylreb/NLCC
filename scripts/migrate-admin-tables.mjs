#!/usr/bin/env node

// Migration script to add missing admin-related tables and columns
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
  console.log('🔄 Starting migration for admin tables...\n');

  const client = await pool.connect();

  try {
    // Step 1: Add missing columns to users table if they don't exist
    console.log('📝 Checking users table columns...');
    
    // Check if lrn column exists
    const lrnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='lrn'
    `);
    
    if (lrnCheck.rows.length === 0) {
      console.log('  Adding lrn column to users table...');
      await client.query(`
        ALTER TABLE users ADD COLUMN lrn VARCHAR(12) UNIQUE
      `);
      console.log('  ✅ Added lrn column');
    } else {
      console.log('  ✅ lrn column already exists');
    }

    // Check if class_name column exists
    const classCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='class_name'
    `);
    
    if (classCheck.rows.length === 0) {
      console.log('  Adding class_name column to users table...');
      await client.query(`
        ALTER TABLE users ADD COLUMN class_name VARCHAR(255)
      `);
      console.log('  ✅ Added class_name column');
    } else {
      console.log('  ✅ class_name column already exists');
    }

    // Step 2: Create activity_logs table if it doesn't exist
    console.log('\n📝 Creating activity_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(255),
        type VARCHAR(50),
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ activity_logs table created/verified');

    // Step 3: Create indexes for activity_logs
    console.log('\n📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)
    `);
    console.log('  ✅ Indexes created');

    // Step 4: Verify preferences and notifications tables exist
    console.log('\n📝 Verifying preferences and notifications tables...');
    
    const prefCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='preferences'
    `);
    
    if (prefCheck.rows.length === 0) {
      console.log('  Creating preferences table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          dark_mode BOOLEAN DEFAULT FALSE,
          sound_effects BOOLEAN DEFAULT TRUE,
          learning_language VARCHAR(50) DEFAULT 'tl',
          daily_goal INTEGER DEFAULT 20
        )
      `);
      console.log('  ✅ preferences table created');
    } else {
      console.log('  ✅ preferences table already exists');
    }

    const notifCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='notifications'
    `);
    
    if (notifCheck.rows.length === 0) {
      console.log('  Creating notifications table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          daily_reminders BOOLEAN DEFAULT TRUE,
          friend_activity BOOLEAN DEFAULT TRUE,
          weekly_report BOOLEAN DEFAULT TRUE
        )
      `);
      console.log('  ✅ notifications table created');
    } else {
      console.log('  ✅ notifications table already exists');
    }

    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
