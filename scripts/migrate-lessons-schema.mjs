#!/usr/bin/env node

// Migration script to fix lessons table schema for teacher lesson creation
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
  console.log('🔄 Starting lessons table migration...\n');

  const client = await pool.connect();

  try {
    // Step 1: Check if lessons table exists
    console.log('📝 Checking lessons table...');
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='lessons'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('  Creating lessons table from scratch...');
      await client.query(`
        CREATE TABLE lessons (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT,
          icon TEXT,
          color VARCHAR(50),
          status VARCHAR(50) DEFAULT 'Published',
          students_count INTEGER DEFAULT 0,
          rating DECIMAL(3,2) DEFAULT 5.00,
          is_archived BOOLEAN DEFAULT FALSE,
          teacher_id VARCHAR(255),
          class_name VARCHAR(255),
          class_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ lessons table created');
    } else {
      console.log('  ✅ lessons table exists');
      
      // Step 2: Check and add missing columns
      console.log('\n📝 Checking for missing columns...');
      
      const columns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='lessons'
      `);
      
      const existingColumns = columns.rows.map(r => r.column_name);
      console.log(`  Found columns: ${existingColumns.join(', ')}`);
      
      // Add teacher_id if missing
      if (!existingColumns.includes('teacher_id')) {
        console.log('  Adding teacher_id column...');
        await client.query(`
          ALTER TABLE lessons ADD COLUMN teacher_id VARCHAR(255)
        `);
        console.log('  ✅ Added teacher_id column');
      }
      
      // Add class_name if missing
      if (!existingColumns.includes('class_name')) {
        console.log('  Adding class_name column...');
        await client.query(`
          ALTER TABLE lessons ADD COLUMN class_name VARCHAR(255)
        `);
        console.log('  ✅ Added class_name column');
      }
      
      // Add class_id if missing
      if (!existingColumns.includes('class_id')) {
        console.log('  Adding class_id column...');
        await client.query(`
          ALTER TABLE lessons ADD COLUMN class_id UUID
        `);
        console.log('  ✅ Added class_id column');
      }
      
      // Add updated_at if missing
      if (!existingColumns.includes('updated_at')) {
        console.log('  Adding updated_at column...');
        await client.query(`
          ALTER TABLE lessons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('  ✅ Added updated_at column');
      }
      
      // Verify critical columns exist
      const criticalColumns = ['id', 'title', 'category', 'icon', 'color', 'status', 'students_count', 'rating'];
      const missingCritical = criticalColumns.filter(col => !existingColumns.includes(col));
      
      if (missingCritical.length > 0) {
        console.log(`\n⚠️  WARNING: Missing critical columns: ${missingCritical.join(', ')}`);
      } else {
        console.log('  ✅ All critical columns present');
      }
    }
    
    // Step 3: Create lesson_items table if needed
    console.log('\n📝 Checking lesson_items table...');
    const itemsTableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='lesson_items'
    `);
    
    if (itemsTableCheck.rows.length === 0) {
      console.log('  Creating lesson_items table...');
      await client.query(`
        CREATE TABLE lesson_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lesson_id VARCHAR(255) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
          primary_text VARCHAR(255),
          secondary_text VARCHAR(255),
          image_emoji VARCHAR(50),
          pronunciation VARCHAR(255),
          link_url TEXT,
          item_order INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ lesson_items table created');
    } else {
      console.log('  ✅ lesson_items table exists');
      
      // Check and add missing columns to lesson_items
      const itemsColumns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='lesson_items'
      `);
      
      const existingItemsColumns = itemsColumns.rows.map(r => r.column_name);
      
      if (!existingItemsColumns.includes('link_url')) {
        console.log('  Adding link_url column to lesson_items...');
        await client.query(`
          ALTER TABLE lesson_items ADD COLUMN link_url TEXT
        `);
        console.log('  ✅ Added link_url column');
      }
      
      if (!existingItemsColumns.includes('updated_at')) {
        console.log('  Adding updated_at column to lesson_items...');
        await client.query(`
          ALTER TABLE lesson_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('  ✅ Added updated_at column');
      }
    }
    
    // Step 4: Create indexes
    console.log('\n📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lessons_class_name ON lessons(class_name)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lesson_items_lesson_id ON lesson_items(lesson_id)
    `);
    console.log('  ✅ Indexes created');
    
    console.log('\n✨ Migration completed successfully!\n');
    
    // Summary
    const lessonCount = await client.query('SELECT COUNT(*) FROM lessons');
    const itemCount = await client.query('SELECT COUNT(*) FROM lesson_items');
    console.log('📊 Database Summary:');
    console.log(`  Lessons: ${lessonCount.rows[0].count}`);
    console.log(`  Lesson Items: ${itemCount.rows[0].count}\n`);

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
