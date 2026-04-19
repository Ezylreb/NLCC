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

async function checkLessonColumns() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check lesson table columns
    const columns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'lesson'
      ORDER BY ordinal_position
    `);

    console.log('📊 LESSON table columns:\n');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Check for bahagi_id specifically
    const hasBahagiId = columns.rows.some(col => col.column_name === 'bahagi_id');
    
    console.log('\n' + '='.repeat(50));
    if (hasBahagiId) {
      console.log('✅ Column "bahagi_id" EXISTS in lesson table');
    } else {
      console.log('❌ Column "bahagi_id" NOT FOUND in lesson table');
      console.log('💡 This is the problem! The query is looking for bahagi_id but it doesn\'t exist.');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkLessonColumns();
