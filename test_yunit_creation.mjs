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

async function testYunitCreation() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // First, get a teacher ID and lesson ID from the database
    console.log('📝 Getting test data...');
    
    const teachersResult = await client.query(`
      SELECT id, email FROM users WHERE role = 'TEACHER' LIMIT 1
    `);
    
    if (teachersResult.rows.length === 0) {
      console.error('❌ No teachers found in database');
      process.exit(1);
    }
    
    const teacherId = teachersResult.rows[0].id;
    const teacherEmail = teachersResult.rows[0].email;
    console.log(`✅ Found teacher: ${teacherEmail} (${teacherId})`);

    const lessonsResult = await client.query(`
      SELECT id, title FROM lessons LIMIT 1
    `);
    
    if (lessonsResult.rows.length === 0) {
      console.error('❌ No lessons found in database');
      process.exit(1);
    }
    
    const lessonId = lessonsResult.rows[0].id;
    const lessonTitle = lessonsResult.rows[0].title;
    console.log(`✅ Found lesson: ${lessonTitle} (${lessonId})`);

    // Now try to create a yunit
    console.log('\n📝 Attempting to create yunit...');
    
    try {
      const result = await client.query(
        `INSERT INTO yunits (title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at`,
        ['Test Yunit Title', 'This is test content', null, lessonId, null, teacherId]
      );

      console.log('✅ YUNIT CREATED SUCCESSFULLY!');
      console.log('Yunit data:', result.rows[0]);
    } catch (err) {
      console.error('❌ YUNIT CREATION FAILED:');
      console.error('  Error message:', err.message);
      console.error('  Error code:', err.code);
      console.error('  Error detail:', err.detail);
      console.error('  Full error:', err);
    }

  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    await client.end();
  }
}

testYunitCreation();
