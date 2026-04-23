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
    console.log('LESSON TABLE COLUMNS:');
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

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkLessonColumns();
