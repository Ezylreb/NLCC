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

async function checkYunits() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Find Pagkilala bahagi
    const bahagiResult = await client.query(`
      SELECT id, title FROM bahagi WHERE title LIKE '%Pagkilala%'
    `);

    if (bahagiResult.rows.length === 0) {
      console.log('❌ No bahagi found with "Pagkilala" in title');
      return;
    }

    const bahagi = bahagiResult.rows[0];
    console.log(`📚 Checking yunits for: ${bahagi.title} (ID: ${bahagi.id})\n`);

    // Check yunits for this bahagi
    const yunitsResult = await client.query(`
      SELECT id, title, subtitle, bahagi_id, display_order, quarter, week_number, module_number
      FROM yunits 
      WHERE bahagi_id = $1
      ORDER BY display_order, created_at
    `, [bahagi.id]);

    console.log(`Found ${yunitsResult.rows.length} yunits:\n`);

    if (yunitsResult.rows.length === 0) {
      console.log('❌ No yunits found for this bahagi');
      console.log('\n💡 The stats might be counting from a different source or there might be orphaned data.');
    } else {
      yunitsResult.rows.forEach((yunit, index) => {
        console.log(`${index + 1}. ${yunit.title}`);
        console.log(`   ID: ${yunit.id}`);
        console.log(`   Subtitle: ${yunit.subtitle || 'N/A'}`);
        console.log(`   Order: ${yunit.display_order || 'N/A'}`);
        console.log(`   Quarter: ${yunit.quarter || 'NOT SET'}`);
        console.log(`   Week: ${yunit.week_number || 'NOT SET'}`);
        console.log(`   Module: ${yunit.module_number || 'NOT SET'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkYunits();
