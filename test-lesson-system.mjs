import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

let connStr = process.env.DATABASE_URL;
if (connStr && !connStr.includes('sslmode')) {
  connStr += (connStr.includes('?') ? '&' : '?') + 'sslmode=disable';
}

const client = new Client({
  connectionString: connStr
});

async function testLessonSystem() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if published lessons exist
    console.log('📖 Published Lessons:');
    const lessonsRes = await client.query(
      "SELECT id, title, status, class_name FROM lessons WHERE status = 'Published' LIMIT 5"
    );
    console.table(lessonsRes.rows);

    if (lessonsRes.rows.length > 0) {
      const firstLesson = lessonsRes.rows[0];
      
      // Get yunits for first lesson
      console.log(`\n📚 Yunits for lesson "${firstLesson.title}":`);
      const yunitsRes = await client.query(
        'SELECT id, title, published_at FROM yunits WHERE lesson_id = $1',
        [firstLesson.id]
      );
      console.table(yunitsRes.rows);

      // Get assessments for first lesson
      console.log(`\n✅ Assessments for lesson "${firstLesson.title}":`);
      const assessmentsRes = await client.query(
        'SELECT id, title, reward, published_at FROM assessments WHERE lesson_id = $1',
        [firstLesson.id]
      );
      console.table(assessmentsRes.rows);
    }

    // Check student class assignments
    console.log('\n👥 Students and their classes:');
    const studentsRes = await client.query(
      "SELECT first_name, email, class_name FROM users WHERE role = 'USER' LIMIT 5"
    );
    console.table(studentsRes.rows);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

testLessonSystem();
