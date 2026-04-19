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

async function addMetadataColumns() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Add columns to bahagi table
    console.log('Adding columns to BAHAGI table...');
    
    await client.query(`
      ALTER TABLE bahagi 
      ADD COLUMN IF NOT EXISTS quarter VARCHAR(20),
      ADD COLUMN IF NOT EXISTS week_number INTEGER,
      ADD COLUMN IF NOT EXISTS module_number VARCHAR(50);
    `);
    
    console.log('✅ Added quarter, week_number, module_number to bahagi table');

    // Add columns to yunits table
    console.log('\nAdding columns to YUNITS table...');
    
    await client.query(`
      ALTER TABLE yunits 
      ADD COLUMN IF NOT EXISTS quarter VARCHAR(20),
      ADD COLUMN IF NOT EXISTS week_number INTEGER,
      ADD COLUMN IF NOT EXISTS module_number VARCHAR(50);
    `);
    
    console.log('✅ Added quarter, week_number, module_number to yunits table');

    // Verify the changes
    console.log('\n\n📋 VERIFICATION:');
    console.log('\nBAHAGI TABLE COLUMNS:');
    const bahagiResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'bahagi'
      ORDER BY ordinal_position
    `);
    
    bahagiResult.rows.forEach(r => {
      const isNew = ['quarter', 'week_number', 'module_number'].includes(r.column_name);
      console.log(`  ${r.column_name}: ${r.data_type}${isNew ? ' ✨ NEW' : ''}`);
    });

    console.log('\n\nYUNITS TABLE COLUMNS:');
    const yunitsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'yunits'
      ORDER BY ordinal_position
    `);
    
    yunitsResult.rows.forEach(r => {
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

addMetadataColumns();
