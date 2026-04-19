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

async function checkBahagiIdTypes() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check bahagi table structure
    const bahagiSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bahagi' AND column_name = 'id'
    `);
    console.log('📊 BAHAGI table id column:');
    console.log(`   Type: ${bahagiSchema.rows[0]?.data_type}`);

    // Check lesson table structure
    const lessonSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lesson' AND column_name = 'bahagi_id'
    `);
    console.log('\n📊 LESSON table bahagi_id column:');
    console.log(`   Type: ${lessonSchema.rows[0]?.data_type}`);

    // Check actual values
    const lessonData = await client.query(`
      SELECT id, title, bahagi_id, 
             pg_typeof(bahagi_id) as bahagi_id_type
      FROM lesson 
      WHERE bahagi_id = 15 OR bahagi_id = '15'
      LIMIT 5
    `);
    
    console.log('\n📋 LESSON table data:');
    console.log(`   Found ${lessonData.rows.length} lessons with bahagi_id = 15 or '15'`);
    lessonData.rows.forEach((row, i) => {
      console.log(`\n   ${i + 1}. ${row.title}`);
      console.log(`      lesson.id: ${row.id} (${typeof row.id})`);
      console.log(`      lesson.bahagi_id: ${row.bahagi_id} (${typeof row.bahagi_id})`);
      console.log(`      pg_typeof: ${row.bahagi_id_type}`);
    });

    // Try the exact query that YunitService would use
    console.log('\n\n🔍 Testing YunitService query:');
    const serviceQuery = await client.query(`
      SELECT * FROM lesson 
      WHERE bahagi_id = $1
      ORDER BY lesson_order ASC, created_at ASC
    `, ['15']); // Try as string

    console.log(`   With bahagi_id = '15' (string): ${serviceQuery.rows.length} results`);

    const serviceQuery2 = await client.query(`
      SELECT * FROM lesson 
      WHERE bahagi_id = $1
      ORDER BY lesson_order ASC, created_at ASC
    `, [15]); // Try as number

    console.log(`   With bahagi_id = 15 (number): ${serviceQuery2.rows.length} results`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkBahagiIdTypes();
