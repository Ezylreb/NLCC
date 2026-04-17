import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function checkLessonSchema() {
  try {
    await client.connect();
    console.log('📋 Checking lesson table schema\n');

    const columnsRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'lesson'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in lesson table:');
    columnsRes.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}`);
    });

    console.log('\n✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkLessonSchema();
