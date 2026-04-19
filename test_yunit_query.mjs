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

async function testYunitQuery() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Test query for bahagi_id 15 (Pagkilala sa Sarili)
    const bahagiId = 15;
    
    console.log(`Testing query: SELECT * FROM lesson WHERE bahagi_id = ${bahagiId}`);
    const result = await client.query(`
      SELECT * FROM lesson 
      WHERE bahagi_id = $1
      ORDER BY lesson_order ASC, created_at ASC
    `, [bahagiId]);
    
    console.log(`\n✅ Found ${result.rows.length} yunits for bahagi ${bahagiId}:\n`);
    
    result.rows.forEach((yunit, i) => {
      console.log(`${i + 1}. ID: ${yunit.id}`);
      console.log(`   Title: ${yunit.title}`);
      console.log(`   Subtitle: ${yunit.subtitle}`);
      console.log(`   Bahagi ID: ${yunit.bahagi_id}`);
      console.log(`   Quarter: ${yunit.quarter || '(not set)'}`);
      console.log(`   Week #: ${yunit.week_number || '(not set)'}`);
      console.log(`   Module #: ${yunit.module_number || '(not set)'}`);
      console.log('');
    });

    // Also test with bahagi_id 21 (Sampol)
    const bahagiId21 = 21;
    console.log(`\nTesting query: SELECT * FROM lesson WHERE bahagi_id = ${bahagiId21}`);
    const result21 = await client.query(`
      SELECT * FROM lesson 
      WHERE bahagi_id = $1
      ORDER BY lesson_order ASC, created_at ASC
    `, [bahagiId21]);
    
    console.log(`\n✅ Found ${result21.rows.length} yunits for bahagi ${bahagiId21}:\n`);
    
    result21.rows.forEach((yunit, i) => {
      console.log(`${i + 1}. ID: ${yunit.id} - ${yunit.title}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testYunitQuery();
