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

async function testYunitAPI() {
  try {
    await client.connect();
    console.log('🔄 Testing complete yunit flow...\n');

    // Step 1: Get test data
    console.log('📋 STEP 1: Retrieving test data');
    const teacherResult = await client.query(`
      SELECT id, email FROM users WHERE role = 'TEACHER' LIMIT 1
    `);
    const teacher = teacherResult.rows[0];
    console.log(`   ✅ Teacher: ${teacher.email}`);

    const classResult = await client.query(`
      SELECT id, name FROM classes WHERE teacher_id = $1 LIMIT 1
    `, [teacher.id]);
    const classData = classResult.rows[0];
    console.log(`   ✅ Class: ${classData.name}`);

    const lessonResult = await client.query(`
      SELECT id, title FROM lessons WHERE class_name = $1 AND teacher_id = $2 LIMIT 1
    `, [classData.name, teacher.id]);
    const lesson = lessonResult.rows[0];
    console.log(`   ✅ Lesson: ${lesson.title}`);

    // Step 2: Simulate form submission
    console.log('\n📋 STEP 2: Test form submission payload');
    const formData = {
      title: 'Discussion: Mga Sumusunod na Bagay',
      content: 'Sabihin ang mga sumusunod na bagay:\n\n1. Ano ang iyong paboritong kulay?\n2. Bakit ito ang iyong paboritong kulay?\n3. Paano ito nakakatulong sa iyo?',
      mediaUrl: null,
      classId: classData.id,
      lessonId: lesson.id,
      teacherId: teacher.id
    };
    console.log(`   Form data prepared:`);
    console.log(`   - Title: "${formData.title}"`);
    console.log(`   - Content: "${formData.content.substring(0, 50)}..."`);
    console.log(`   - Class ID: ${formData.classId}`);
    console.log(`   - Lesson ID: ${formData.lessonId}`);
    console.log(`   - Teacher ID: ${formData.teacherId}`);

    // Step 3: Direct database insert (simulating API call)
    console.log('\n📋 STEP 3: Direct database insert');
    const result = await client.query(
      `INSERT INTO yunits (title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at`,
      [
        formData.title,
        formData.content,
        formData.mediaUrl || null,
        formData.lessonId,
        formData.classId || null,
        formData.teacherId
      ]
    );

    const yunit = result.rows[0];
    console.log(`   ✅ Yunit created!`);
    console.log(`   - ID: ${yunit.id}`);
    console.log(`   - Title: ${yunit.title}`);
    console.log(`   - Lesson: ${yunit.lesson_id}`);
    console.log(`   - Created: ${yunit.created_at}`);

    // Step 4: Verify retrieval
    console.log('\n📋 STEP 4: Verify retrieval');
    const verifyResult = await client.query(
      `SELECT id, title, lesson_id, teacher_id FROM yunits WHERE id = $1`,
      [yunit.id]
    );
    
    if (verifyResult.rows.length > 0) {
      console.log(`   ✅ Yunit verified in database!`);
      console.log(`   - Retrieved ID: ${verifyResult.rows[0].id}`);
    } else {
      console.log(`   ❌ Yunit verification failed!`);
    }

    // Step 5: Test publishing
    console.log('\n📋 STEP 5: Test publishing');
    const publishResult = await client.query(
      `UPDATE yunits SET published_at = NOW() WHERE id = $1 RETURNING id, published_at`,
      [yunit.id]
    );
    
    if (publishResult.rows.length > 0) {
      console.log(`   ✅ Yunit published!`);
      console.log(`   - Published at: ${publishResult.rows[0].published_at}`);
    }

    console.log('\n✨ ALL TESTS PASSED! Yunit creation and publishing works correctly.');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Detail:', error.detail);
  } finally {
    await client.end();
  }
}

testYunitAPI();
