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

async function checkYunitsData() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check lesson table
    console.log('LESSON TABLE:');
    const lessonResult = await client.query(`
      SELECT id, bahagi_id, title, created_at
      FROM lesson
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`  Found ${lessonResult.rows.length} rows`);
    lessonResult.rows.forEach((r, i) => {
      console.log(`  ${i+1}. [${r.id}] ${r.title} (bahagi_id: ${r.bahagi_id})`);
    });

    // Check yunits table
    console.log('\n\nYUNITS TABLE:');
    const yunitsResult = await client.query(`
      SELECT id, bahagi_id, title, created_at
      FROM yunits
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`  Found ${yunitsResult.rows.length} rows`);
    yunitsResult.rows.forEach((r, i) => {
      console.log(`  ${i+1}. [${r.id}] ${r.title} (bahagi_id: ${r.bahagi_id})`);
    });

    // Check bahagi table
    console.log('\n\nBAHAGI TABLE:');
    const bahagiResult = await client.query(`
      SELECT id, title, class_name
      FROM bahagi
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(`  Found ${bahagiResult.rows.length} rows`);
    bahagiResult.rows.forEach((r, i) => {
      console.log(`  ${i+1}. [${r.id}] ${r.title} (class: ${r.class_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkYunitsData();
