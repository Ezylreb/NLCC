import { config } from 'dotenv';
import pg from 'pg';
const { Client } = pg;

config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function addLessonMetadataColumns() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Add columns to lesson table
    console.log('Adding columns to LESSON table...');
    
    await client.query(`
      ALTER TABLE lesson 
      ADD COLUMN IF NOT EXISTS quarter VARCHAR(20),
      ADD COLUMN IF NOT EXISTS week_number INTEGER,
      ADD COLUMN IF NOT EXISTS module_number VARCHAR(50);
    `);
    
    console.log('✅ Added quarter, week_number, module_number to lesson table');

    // Verify the changes
    console.log('\n\n📋 VERIFICATION:');
    console.log('\nLESSON TABLE COLUMNS:');
    const lessonResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'lesson'
      ORDER BY ordinal_position
    `);
    
    lessonResult.rows.forEach(r => {
      const isNew = ['quarter', 'week_number', 'module_number'].includes(r.column_name);
      console.log(`  ${r.column_name}: ${r.data_type}${isNew ? ' ✨ NEW' : ''}`);
    });

    console.log('\n\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

addLessonMetadataColumns();
