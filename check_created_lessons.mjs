import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function checkLessons() {
  try {
    await client.connect();
    console.log('📋 Checking lessons in database\n');

    const lessonsRes = await client.query(`
      SELECT l.id, l.bahagi_id, l.title, l.lesson_order, l.created_at,
             b.title as bahagi_title, b.class_name
      FROM lesson l
      LEFT JOIN bahagi b ON l.bahagi_id = b.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);
    
    if (lessonsRes.rows.length === 0) {
      console.log('❌ No lessons found in database');
    } else {
      console.log(`✅ Found ${lessonsRes.rows.length} lessons:\n`);
      lessonsRes.rows.forEach(lesson => {
        console.log(`ID: ${lesson.id} | Bahagi: ${lesson.bahagi_title} (ID: ${lesson.bahagi_id})`);
        console.log(`  Title: ${lesson.title}`);
        console.log(`  Order: ${lesson.lesson_order} | Created: ${lesson.created_at}`);
        console.log('');
      });
    }

    // Count lessons by bahagi
    const countRes = await client.query(`
      SELECT bahagi_id, COUNT(*) as count
      FROM lesson
      GROUP BY bahagi_id
      ORDER BY bahagi_id
    `);
    
    console.log('\n📊 Lessons per Bahagi:');
    countRes.rows.forEach(row => {
      console.log(`  Bahagi ID ${row.bahagi_id}: ${row.count} lessons`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkLessons();
