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

async function testExactRepositoryQuery() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // This is the EXACT query the repository will build
    const bahagiId = '15'; // String from URL
    
    console.log('📝 Testing exact repository query:');
    console.log('WHERE bahagi_id = $1');
    console.log('Parameter: $1 =', bahagiId, `(type: ${typeof bahagiId})`);
    
    const sql = 'SELECT * FROM lesson WHERE bahagi_id = $1 ORDER BY lesson_order ASC, created_at ASC';
    
    console.log('\n🔍 Executing SQL:', sql);
    const result = await client.query(sql, [bahagiId]);
    
    console.log(`\n📊 Result: ${result.rows.length} rows`);
    
    if (result.rows.length > 0) {
      console.log('\n✅ SUCCESS! Found lessons:');
      result.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.title}`);
        console.log(`     lesson.id: ${row.id}, bahagi_id: ${row.bahagi_id}`);
      });
    } else {
      console.log('\n❌ FAIL! No rows returned');
      console.log('This means the repository query is correct but returns empty.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testExactRepositoryQuery();
