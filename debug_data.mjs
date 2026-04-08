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

async function debugData() {
  try {
    await client.connect();

    console.log('🔍 Checking complete data structure\n');

    // All teachers
    const teachers = await client.query(`SELECT id, email FROM users WHERE role = 'TEACHER'`);
    console.log(`Found ${teachers.rows.length} teachers`);
    teachers.rows.forEach(t => console.log(`  - ${t.email}`));

    if (teachers.rows.length > 0) {
      const teacherId = teachers.rows[0].id;

      // Classes for this teacher
      const classes = await client.query(`SELECT id, name FROM classes WHERE teacher_id = $1`, [teacherId]);
      console.log(`\n${teachers.rows[0].email} has ${classes.rows.length} classes`);
      classes.rows.forEach(c => console.log(`  - ${c.name} (${c.id})`));

      if (classes.rows.length > 0) {
        // Lessons for first class
        const lessons = await client.query(
          `SELECT id, title FROM lessons WHERE class_name = $1`,
          [classes.rows[0].name]
        );
        console.log(`\n"${classes.rows[0].name}" has ${lessons.rows.length} lessons`);
        lessons.rows.forEach(l => console.log(`  - ${l.title} (${l.id})`));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

debugData();
