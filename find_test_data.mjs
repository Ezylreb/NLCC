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

async function findTestData() {
  try {
    await client.connect();

    // Just use known data
    const teacher = await client.query(`
      SELECT id, email FROM users WHERE role = 'TEACHER' LIMIT 1
    `);
    const teacherId = teacher.rows[0].id;

    const lesson = await client.query(`
      SELECT id, title, class_name FROM lessons 
      WHERE teacher_id = $1::uuid 
      LIMIT 1
    `, [teacherId]);
    
    const classData = await client.query(`
      SELECT id, name FROM classes 
      WHERE teacher_id = $1::uuid 
      LIMIT 1
    `, [teacherId]);

    console.log('✅ Test Data Found:');
    console.log(`   Teacher Email: ${teacher.rows[0].email}`);
    console.log(`   Teacher ID: ${teacherId}`);
    
    if (lesson.rows.length > 0) {
      console.log(`   Lesson:  ${lesson.rows[0].title} (${lesson.rows[0].id})`);
    }
    if (classData.rows.length > 0) {
      console.log(`   Class: ${classData.rows[0].name} (${classData.rows[0].id})`);
    }

    // Prepare test credentials for API
    console.log('\n📋 Use these for testing:');
    console.log(`Teacher Email: ${teacher.rows[0].email}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

findTestData();
