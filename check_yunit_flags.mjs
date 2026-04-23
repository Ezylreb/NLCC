import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function checkYunitFlags() {
  try {
    await client.connect();
    console.log('🔍 Checking is_published and is_archived flags for bahagi_id 15\n');

    const yunitsRes = await client.query(`
      SELECT id, title, bahagi_id, is_published, is_archived, lesson_order
      FROM lesson
      WHERE bahagi_id = 15
      ORDER BY lesson_order NULLS LAST, created_at ASC
    `);
    
    console.log(`Found ${yunitsRes.rows.length} yunits for bahagi_id 15:\n`);
    yunitsRes.rows.forEach((y, idx) => {
      console.log(`${idx + 1}. ${y.title}`);
      console.log(`   - ID: ${y.id}`);
      console.log(`   - is_published: ${y.is_published}`);
      console.log(`   - is_archived: ${y.is_archived}`);
      console.log(`   - lesson_order: ${y.lesson_order || 'null'}`);
      console.log('');
    });

    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
  }
}

checkYunitFlags();
