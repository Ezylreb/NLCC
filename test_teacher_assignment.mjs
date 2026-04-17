import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const { Pool } = pg;

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function testTeacherAssignment() {
  try {
    console.log('🧪 Testing Teacher Assignment System\n');
    console.log('=' .repeat(60));
    
    // Test with Maria Santos - teacher with most classes
    const teacherId = 'ba70c802-29ac-421d-b5c9-863486d7312e';
    const classId = '1da1eb7f-0a03-46d9-9705-db89c48da047'; // Kinder 1
    
    console.log('\n📚 Teacher: Maria Santos');
    console.log(`   Teacher ID: ${teacherId}`);
    console.log(`   Class: Kinder 1 (${classId})\n`);
    console.log('=' .repeat(60));
    
    // 1. Check all students in database
    console.log('\n1️⃣ All students in database:\n');
    const allStudents = await pool.query(`
      SELECT id, first_name, last_name, email, teacher_id
      FROM users
      WHERE (role = 'student' OR role = 'USER')
      ORDER BY teacher_id NULLS LAST, first_name
    `);
    
    const assigned = allStudents.rows.filter(s => s.teacher_id);
    const unassigned = allStudents.rows.filter(s => !s.teacher_id);
    
    console.log(`   Total students: ${allStudents.rows.length}`);
    console.log(`   Assigned to teachers: ${assigned.length}`);
    console.log(`   Unassigned: ${unassigned.length}\n`);
    
    if (assigned.length > 0) {
      console.log('   Assigned students:');
      assigned.forEach(s => {
        const isForMaria = s.teacher_id === teacherId;
        console.log(`     ${isForMaria ? '✅' : '  '} ${s.first_name} ${s.last_name} → Teacher: ${s.teacher_id?.substring(0, 8)}...`);
      });
    }
    
    if (unassigned.length > 0) {
      console.log('\n   ⚠️  Unassigned students:');
      unassigned.forEach(s => {
        console.log(`     ❌ ${s.first_name} ${s.last_name} (${s.email})`);
      });
    }
    
    // 2. Check students available for Maria Santos
    console.log('\n\n2️⃣ Students available to Maria Santos (with NEW filter):\n');
    const availableForMaria = await pool.query(
      `SELECT 
          u.id,
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.email,
          u.teacher_id
      FROM users u
      WHERE (u.role = 'student' OR u.role = 'USER')
      AND u.teacher_id = $2
      AND u.id NOT IN (
          SELECT student_id FROM class_enrollments WHERE class_id = $1
      )
      ORDER BY u.first_name, u.last_name`,
      [classId, teacherId]
    );
    
    console.log(`   Available students: ${availableForMaria.rows.length}\n`);
    
    if (availableForMaria.rows.length > 0) {
      availableForMaria.rows.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.firstName} ${s.lastName}`);
        console.log(`      Email: ${s.email}`);
        console.log(`      Teacher assigned: ✅ (${s.teacher_id?.substring(0, 8)}...)`);
      });
    } else {
      console.log('   ⚠️  No students available for this teacher');
      console.log('   This means:');
      console.log('     • All of this teacher\'s students are already enrolled, OR');
      console.log('     • No students have been assigned to this teacher yet');
    }
    
    // 3. Check enrolled students in this class
    console.log('\n\n3️⃣ Students already enrolled in Kinder 1:\n');
    const enrolledInClass = await pool.query(
      `SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.teacher_id
      FROM users u
      JOIN class_enrollments ce ON u.id = ce.student_id
      WHERE ce.class_id = $1`,
      [classId]
    );
    
    console.log(`   Enrolled students: ${enrolledInClass.rows.length}\n`);
    
    if (enrolledInClass.rows.length > 0) {
      enrolledInClass.rows.forEach((s, i) => {
        const isMariaStudent = s.teacher_id === teacherId;
        console.log(`   ${i + 1}. ${s.first_name} ${s.last_name}`);
        console.log(`      ${isMariaStudent ? '✅ Assigned to Maria' : '⚠️  Different teacher'}`);
      });
    }
    
    // 4. Recommendation
    console.log('\n\n4️⃣ Admin Action Required:\n');
    
    if (unassigned.length > 0) {
      console.log('   ⚠️  You have unassigned students!');
      console.log('   To make them available to teachers:');
      console.log('   1. Go to Admin Dashboard → Users tab');
      console.log('   2. Click "Manage" on each student');
      console.log('   3. Select "Assigned Teacher" from dropdown');
      console.log('   4. Select "Assigned Class" from dropdown');
      console.log('   5. Click "Save Changes"\n');
      
      console.log('   Unassigned students:');
      unassigned.forEach(s => {
        console.log(`     • ${s.first_name} ${s.last_name} (${s.email})`);
      });
    } else {
      console.log('   ✅ All students are assigned to teachers!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testTeacherAssignment();
