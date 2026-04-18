import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function checkEnrollmentsSchema() {
  try {
    await client.connect();
    
    const columnsRes = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'class_enrollments'
      ORDER BY ordinal_position
    `);
    
    console.log('class_enrollments columns:');
    columnsRes.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkEnrollmentsSchema();
