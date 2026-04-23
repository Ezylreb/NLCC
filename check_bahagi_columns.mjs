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

async function checkColumns() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check Bahagi table columns
    console.log('BAHAGI TABLE COLUMNS:');
    const bahagiResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'bahagi'
      ORDER BY ordinal_position
    `);
    
    bahagiResult.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type}`);
    });

    console.log('\n\nYUNITS TABLE COLUMNS:');
    const yunitsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'yunits'
      ORDER BY ordinal_position
    `);
    
    yunitsResult.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

checkColumns();
