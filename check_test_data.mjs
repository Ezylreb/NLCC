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

async function checkTestData() {
  try {
    await client.connect();
    console.log('📊 CHECKING TEST DATA\n');

    // Teachers
    const teachers = await client.query(`
      SELECT id, email, role FROM users WHERE role = 'TEACHER' ORDER BY created_at DESC LIMIT 3
    `);
    console.log('👨‍🏫 Teachers:');
    teachers.rows.forEach(t => console.log(`   - ${t.email}`));

    // Classes
    const classes = await client.query(`
      SELECT id, name, teacher_id FROM classes LIMIT 5
    `);
    console.log('\n🏫 Classes:');
    classes.rows.forEach(c => console.log(`   - ${c.name}`));

    // Lessons
    const lessons = await client.query(`
      SELECT id, title, class_name, teacher_id FROM lessons LIMIT 5
    `);
    console.log('\n📖 Lessons:');
    lessons.rows.forEach(l => console.log(`   - ${l.title} (class: ${l.class_name})`));

    // Better test: Get a teacher with actual classes and lessons
    console.log('\n🔍 Finding best test data...');
    const teacherWithData = await client.query(`
      SELECT DISTINCT u.id, u.email, c.id as class_id, c.name as class_name, l.id as lesson_id, l.title as lesson_title
      FROM users u
      LEFT JOIN classes c ON u.id = c.teacher_id
      LEFT JOIN lessons l ON l.class_name = c.name AND l.teacher_id = u.id
      WHERE u.role = 'TEACHER' 
      AND c.id IS NOT NULL 
      AND l.id IS NOT NULL
      LIMIT 1
    `);
    
    if (teacherWithData.rows.length > 0) {
      const row = teacherWithData.rows[0];
      console.log(`   ✅ Found test data:`);
      console.log(`      Teacher: ${row.email}`);
      console.log(`      Class: ${row.class_name}`);
      console.log(`      Lesson: ${row.lesson_title}`);
      console.log(`\n   Use this in your test!`);
    } else {
      console.log('   ❌ No complete test data found. Need to create sample data.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTestData();
