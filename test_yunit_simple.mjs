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

async function testYunitCreationDirect() {
  try {
    await client.connect();
    console.log('🔄 Testing yunit creation with correct schema...\n');

    // Get a teacher (user with TEACHER role)
    const teacherResult = await client.query(`
      SELECT id, email FROM users WHERE role = 'TEACHER' LIMIT 1
    `);
    const teacherId = teacherResult.rows[0].id;
    const teacherEmail = teacherResult.rows[0].email;

    // Get a class owned by this teacher
    const classResult = await client.query(`
      SELECT id, name FROM classes WHERE teacher_id = $1 LIMIT 1
    `, [teacherId]);
    const classId = classResult.rows[0].id;
    const className = classResult.rows[0].name;

    // Get a lesson for this class
    const lessonResult = await client.query(`
      SELECT id, title FROM lessons WHERE class_name = $1 AND teacher_id = $2 LIMIT 1
    `, [className, teacherId]);
    const lessonId = lessonResult.rows[0].id;
    const lessonTitle = lessonResult.rows[0].title;

    console.log('📋 Test Setup:');
    console.log(`   Teacher: ${teacherEmail} (${teacherId})`);
    console.log(`   Class: ${className} (${classId})`);
    console.log(`   Lesson: ${lessonTitle} (${lessonId})`);

    // Create yunit - exactly as the API would
    console.log('\n🔄 Creating yunit...');
    const createResult = await client.query(
      `INSERT INTO yunits (title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, title, content, lesson_id, teacher_id, created_at`,
      [
        'Tema: Ang Ating Pamilya',
        'Tukuyin ang mga miyembro ng iyong pamilya at ipaliwanag kung bakit mahalaga ang bawat isa.\n\n1. Sino ang iyong mga magulang?\n2. Ano ang kanilang ginagawa?\n3. Paano mo sila matutulungan?',
        null, // media_url
        lessonId,
        classId,
        teacherId
      ]
    );

    const yunit = createResult.rows[0];
    console.log('   ✅ SUCCESS! Yunit created:');
    console.log(`   - ID: ${yunit.id}`);
    console.log(`   - Title: ${yunit.title}`);
    console.log(`   - Created: ${yunit.created_at}`);

    // Test publishing
    console.log('\n🔄 Publishing yunit...');
    const publishResult = await client.query(
      `UPDATE yunits SET published_at = NOW() WHERE id = $1 RETURNING id, published_at`,
      [yunit.id]
    );
    console.log(`   ✅ Published at: ${publishResult.rows[0].published_at}`);

    console.log('\n✨ Complete test flow successful!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
    if (error.code) console.error('   Code:', error.code);
  } finally {
    await client.end();
  }
}

testYunitCreationDirect();
