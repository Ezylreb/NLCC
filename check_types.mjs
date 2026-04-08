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

async function checkTypes() {
  try {
    await client.connect();

    console.log('📋 Checking data types\n');

    // Check users table structure
    const usersColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('id', 'email', 'teacher_id')
      ORDER BY ordinal_position
    `);
    console.log('Users table:');
    usersColumns.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // Check lessons table structure
    const lessonsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lessons' 
      AND column_name IN ('id', 'teacher_id', 'class_name')
      ORDER BY ordinal_position
    `);
    console.log('\nLessons table:');
    lessonsColumns.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // Check classes table structure
    const classesColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'classes' 
      AND column_name IN ('id', 'teacher_id', 'name')
      ORDER BY ordinal_position
    `);
    console.log('\nClasses table:');
    classesColumns.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // Get actual data
    console.log('\n📊 First teacher:');
    const teacher = await client.query(`SELECT id, email FROM users WHERE role = 'TEACHER' LIMIT 1`);
    if (teacher.rows.length > 0) {
      console.log(`  Email: ${teacher.rows[0].email}`);
      console.log(`  ID type: ${typeof teacher.rows[0].id}`);
      console.log(`  ID value: ${teacher.rows[0].id}`);
    }

    // First lesson
    console.log('\n📖 First lesson:');
    const lesson = await client.query(`SELECT id, title, teacher_id FROM lessons LIMIT 1`);
    if (lesson.rows.length > 0) {
      console.log(`  Title: ${lesson.rows[0].title}`);
      console.log(`  ID: ${lesson.rows[0].id} (type: ${typeof lesson.rows[0].id})`);
      console.log(`  Teacher ID: ${lesson.rows[0].teacher_id} (type: ${typeof lesson.rows[0].teacher_id})`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTypes();
