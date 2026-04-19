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

async function checkLessonsVsYunits() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Find Pagkilala bahagi
    const bahagiResult = await client.query(`
      SELECT id, title FROM bahagi WHERE title LIKE '%Pagkilala%'
    `);

    if (bahagiResult.rows.length === 0) {
      console.log('❌ No bahagi found');
      return;
    }

    const bahagi = bahagiResult.rows[0];
    console.log(`📚 Checking for: ${bahagi.title} (ID: ${bahagi.id})\n`);

    // Check LESSON table
    const lessonsResult = await client.query(`
      SELECT id, title, subtitle, bahagi_id
      FROM lesson 
      WHERE bahagi_id = $1
    `, [bahagi.id]);

    console.log(`📖 LESSON table: ${lessonsResult.rows.length} entries`);
    if (lessonsResult.rows.length > 0) {
      lessonsResult.rows.forEach((lesson, i) => {
        console.log(`  ${i + 1}. ${lesson.title} (ID: ${lesson.id})`);
      });
    }

    // Check YUNITS table
    const yunitsResult = await client.query(`
      SELECT id, title, subtitle, bahagi_id
      FROM yunits 
      WHERE bahagi_id = $1
    `, [bahagi.id]);

    console.log(`\n📝 YUNITS table: ${yunitsResult.rows.length} entries`);
    if (yunitsResult.rows.length > 0) {
      yunitsResult.rows.forEach((yunit, i) => {
        console.log(`  ${i + 1}. ${yunit.title} (ID: ${yunit.id})`);
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('ISSUE FOUND:');
    console.log(`The stats show lessonCount (from LESSON table): ${lessonsResult.rows.length}`);
    console.log(`But the UI fetches from YUNITS table: ${yunitsResult.rows.length}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkLessonsVsYunits();
