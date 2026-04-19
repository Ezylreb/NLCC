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

async function updateBahagiMetadata() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Update the Pagkilala sa Sarili bahagi
    const result = await client.query(`
      UPDATE bahagi 
      SET 
        quarter = 'First',
        week_number = 1,
        module_number = 'Module 1',
        updated_at = NOW()
      WHERE title LIKE '%Pagkilala%'
      RETURNING id, title, quarter, week_number, module_number
    `);

    if (result.rows.length > 0) {
      console.log('✅ Updated bahagi:');
      result.rows.forEach(row => {
        console.log(`\nID: ${row.id}`);
        console.log(`Title: ${row.title}`);
        console.log(`Quarter: ${row.quarter}`);
        console.log(`Week: ${row.week_number}`);
        console.log(`Module: ${row.module_number}`);
      });
      console.log('\n🎉 Metadata updated successfully!');
      console.log('💡 Now refresh your browser to see the changes.');
    } else {
      console.log('❌ No bahagi found to update');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updateBahagiMetadata();
