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

async function testAvailableStudents() {
  try {
    // Maria Santos - Teacher with many classes
    const teacherId = 'ba70c802-29ac-421d-b5c9-863486d7312e';
    const classId = '1da1eb7f-0a03-46d9-9705-db89c48da047'; // Kinder 1
    
    console.log('🧪 Testing Available Students API\n');
    console.log(`Teacher: Maria Santos`);
    console.log(`Class ID: ${classId}\n`);
    
    // Test 1: Check if class exists and teacher owns it
    console.log('1️⃣ Verifying class ownership...\n');
    const classCheck = await pool.query(
      `SELECT id, name, teacher_id FROM classes WHERE id = $1 AND teacher_id = $2`,
      [classId, teacherId]
    );
    
    if (classCheck.rows.length === 0) {
      console.log('❌ Class not found or teacher does not own this class');
      return;
    }
    
    console.log(`✅ Class found: ${classCheck.rows[0].name}`);
    console.log(`   Teacher ID matches: ${classCheck.rows[0].teacher_id === teacherId}\n`);
    
    // Test 2: Check all users
    console.log('2️⃣ Checking all users in database...\n');
    const allUsers = await pool.query(`
      SELECT id, first_name, last_name, email, role
      FROM users
      ORDER BY role, first_name
    `);
    
    console.log(`Total users: ${allUsers.rows.length}`);
    const usersByRole = allUsers.rows.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    console.log('');
    
    // Test 3: Check enrolled students in this class
    console.log('3️⃣ Checking enrolled students in this class...\n');
    const enrolled = await pool.query(
      `SELECT student_id FROM class_enrollments WHERE class_id = $1`,
      [classId]
    );
    
    console.log(`Enrolled students: ${enrolled.rows.length}`);
    if (enrolled.rows.length > 0) {
      console.log('   Enrolled IDs:', enrolled.rows.map(r => r.student_id));
    }
    console.log('');
    
    // Test 4: Run the exact query from the API
    console.log('4️⃣ Testing API query for available students...\n');
    const availableQuery = await pool.query(
      `SELECT 
          u.id,
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.email,
          u.role
      FROM users u
      WHERE (u.role = 'student' OR u.role = 'USER')
      AND u.id NOT IN (
          SELECT student_id FROM class_enrollments WHERE class_id = $1
      )
      ORDER BY u.first_name, u.last_name`,
      [classId]
    );
    
    console.log(`✅ Available students: ${availableQuery.rows.length}\n`);
    
    if (availableQuery.rows.length > 0) {
      console.log('Available students list:');
      availableQuery.rows.slice(0, 5).forEach((student, i) => {
        console.log(`   ${i + 1}. ${student.firstName} ${student.lastName} (${student.email})`);
        console.log(`      Role: ${student.role}`);
      });
      
      if (availableQuery.rows.length > 5) {
        console.log(`   ... and ${availableQuery.rows.length - 5} more`);
      }
    } else {
      console.log('⚠️  No available students found!');
      console.log('\nPossible reasons:');
      console.log('  1. All students are already enrolled');
      console.log('  2. No users with role "student" or "USER" exist');
    }
    
    // Test 5: Test the HTTP endpoint
    console.log('\n5️⃣ Testing HTTP endpoint...\n');
    
    const url = `http://localhost:3000/api/teacher/available-students?classId=${classId}&teacherId=${teacherId}`;
    console.log(`URL: ${url}\n`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    
    if (data.success) {
      console.log(`✅ API Response:`);
      console.log(`   Available students: ${data.data?.totalAvailable || 0}`);
    } else {
      console.log(`❌ API Error: ${data.error}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testAvailableStudents();
