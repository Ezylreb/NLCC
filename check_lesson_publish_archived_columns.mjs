import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function checkColumns() {
  try {
    await client.connect();
    console.log('🔍 Checking for is_published and is_archived columns in lesson table\n');

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'lesson' 
      AND column_name IN ('is_published', 'is_archived')
      ORDER BY column_name
    `);
    
    if (res.rows.length === 0) {
      console.log('❌ MISSING: is_published and is_archived columns do not exist!');
      console.log('\n📝 Need to add these columns to the lesson table.');
    } else {
      console.log('✅ Found columns:');
      res.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) - default: ${col.column_default}`);
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkColumns();
