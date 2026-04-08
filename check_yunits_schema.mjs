import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

let connStr = process.env.DATABASE_URL;
if (connStr && !connStr.includes('sslmode')) {
  connStr += (connStr.includes('?') ? '&' : '?') + 'sslmode=disable';
}

const client = new Client({
  connectionString: connStr
});

async function checkSchema() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'yunits'
      ORDER BY ordinal_position
    `);
    
    console.log('YUNITS TABLE FULL SCHEMA:');
    console.log('========================= ');
    result.rows.forEach((row, idx) => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      const defaultVal = row.column_default ? ` default: ${row.column_default}` : '';
      console.log(`${idx + 1}. ${row.column_name}: ${row.data_type} ${nullable}${defaultVal}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
