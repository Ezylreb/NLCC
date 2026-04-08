import { config } from 'dotenv';
import { Client } from 'pg';

// Load environment variables
config({ path: '.env.local' });

// Parse connection string
let connStr = process.env.DATABASE_URL;
if (connStr && !connStr.includes('sslmode')) {
  connStr += (connStr.includes('?') ? '&' : '?') + 'sslmode=disable';
}

const client = new Client({
  connectionString: connStr
});

console.log('Testing FIXED stats query (with type casting)...\n');

try {
  await client.connect();
  
  // Use the teacher ID we found
  const teacherId = '65deecd4-64fa-4d8e-b9dc-569f258fedeb';
  
  console.log(`Testing with teacher ID: ${teacherId}\n`);
  
  // Test the FIXED query with proper type casting
  const classesRes = await client.query(`
    SELECT 
        c.id,
        c.name,
        c.teacher_id,
        c.is_archived,
        c.created_at,
        (SELECT COUNT(*) FROM users WHERE role = 'USER' AND class_name = c.name)::INT as student_count,
        (SELECT COUNT(*) FROM lessons WHERE class_name = c.name AND teacher_id::uuid = c.teacher_id)::INT as lesson_count
    FROM classes c
    WHERE c.teacher_id = $1 AND c.is_archived = FALSE
    GROUP BY c.id, c.name, c.teacher_id, c.is_archived, c.created_at
    ORDER BY c.created_at DESC
  `, [teacherId]);

  console.log(`✅ Query returned ${classesRes.rows.length} classes:\n`);
  classesRes.rows.forEach((row, i) => {
    console.log(`${i+1}. "${row.name}"`);
    console.log(`   ID: ${row.id}`);
    console.log(`   Students: ${row.student_count}, Lessons: ${row.lesson_count}`);
    console.log(`   Archived: ${row.is_archived}\n`);
  });
  
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await client.end();
}
