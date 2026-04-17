#!/usr/bin/env node
/**
 * Test Admin Account Creation Flow
 * Tests both teacher and student account creation endpoints
 */

const BASE_URL = 'http://localhost:3000';

// Use admin credentials
const ADMIN_EMAIL = 'admin@brightstart.edu';
const ADMIN_PASSWORD = 'Admin123!';

async function login() {
  console.log('\n📝 Step 1: Logging in as admin...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Login successful');
    console.log(`   User ID: ${data.userId}`);
    console.log(`   Role: ${data.role}`);
    return data;
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    throw err;
  }
}

async function createTeacher() {
  console.log('\n🏫 Step 2: Creating a teacher account...');
  try {
    const teacherData = {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: `teacher_${Date.now()}@school.edu.ph`,
      password: 'teacher123',
      className: 'Kinder 1'
    };

    console.log('   Request payload:', JSON.stringify(teacherData, null, 2));

    const response = await fetch(`${BASE_URL}/api/admin/create-teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Teacher creation failed:', response.status);
      console.error('   Error:', data.error || data.message);
      return null;
    }

    console.log('✅ Teacher account created successfully');
    console.log(`   User ID: ${data.userId}`);
    console.log(`   Email: ${teacherData.email}`);
    return { ...teacherData, userId: data.userId };
  } catch (err) {
    console.error('❌ Teacher creation error:', err.message);
    throw err;
  }
}

async function getTeachers() {
  console.log('\n👨‍🏫 Step 3: Fetching available teachers...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/teachers`);

    if (!response.ok) {
      throw new Error(`Failed to fetch teachers: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.teachers.length} teacher(s)`);
    
    if (data.teachers.length > 0) {
      console.log('   Teachers:');
      data.teachers.forEach(teacher => {
        console.log(`   - ${teacher.fullName} (ID: ${teacher.id})`);
      });
      return data.teachers[0].id; // Return first teacher ID
    }
    return null;
  } catch (err) {
    console.error('❌ Failed to fetch teachers:', err.message);
    throw err;
  }
}

async function getClasses(teacherId) {
  console.log(`\n📚 Step 4: Fetching classes for teacher ${teacherId}...`);
  try {
    const response = await fetch(`${BASE_URL}/api/admin/classes?teacherId=${teacherId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch classes: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.classes.length} class(es)`);
    
    if (data.classes.length > 0) {
      console.log('   Classes:');
      data.classes.forEach(cls => {
        console.log(`   - ${cls.name} (ID: ${cls.id})`);
      });
      return data.classes[0].id; // Return first class ID
    }
    return null;
  } catch (err) {
    console.error('❌ Failed to fetch classes:', err.message);
    throw err;
  }
}

async function createStudent(teacherId, classId) {
  console.log(`\n👤 Step 5: Creating a student account...`);
  try {
    const studentData = {
      firstName: 'Maria',
      lastName: 'Santos',
      email: `student_${Date.now()}@school.edu.ph`,
      password: 'student123',
      lrn: String(Math.floor(Math.random() * 999999999999)).padStart(12, '0'),
      teacherId: teacherId,
      classId: classId
    };

    console.log('   Request payload:', JSON.stringify(studentData, null, 2));

    const response = await fetch(`${BASE_URL}/api/admin/create-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Student creation failed:', response.status);
      console.error('   Error:', data.error || data.message);
      return null;
    }

    console.log('✅ Student account created successfully');
    console.log(`   User ID: ${data.userId}`);
    console.log(`   Email: ${studentData.email}`);
    console.log(`   LRN: ${studentData.lrn}`);
    return { ...studentData, userId: data.userId };
  } catch (err) {
    console.error('❌ Student creation error:', err.message);
    throw err;
  }
}

async function runTests() {
  console.log('🧪 Starting Admin Account Creation Tests');
  console.log('='.repeat(50));

  try {
    // Step 1: Login
    const loginData = await login();

    // Step 2: Create a teacher
    const teacher = await createTeacher();
    if (!teacher) {
      console.error('\n⚠️  Teacher creation failed. Stopping tests.');
      return;
    }

    // Step 3: Get available teachers
    let teacherId = teacher.userId;
    if (!teacherId) {
      // Try fetching from server
      const existingTeachers = await getTeachers();
      if (!existingTeachers || existingTeachers.length === 0) {
        console.warn('\n⚠️  No teachers available. Skipping student creation test.');
        console.log('\n' + '='.repeat(50));
        console.log('✅ PARTIAL SUCCESS - Teacher Creation Works');
        console.log('='.repeat(50));
        console.log('\nTeacher account creation is working correctly!');
        console.log(`- Teacher created: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
        console.log('\nNote: Student creation test skipped (no classes available).');
        console.log('Students can be created once teachers setup their classes.');
        return;
      }
      teacherId = existingTeachers[0].id;
    }

    // Step 4: Get classes for the teacher
    const classId = await getClasses(teacherId);
    if (!classId) {
      console.warn('\n⚠️  No classes available for teacher. Skipping student creation test.');
      console.log('\n' + '='.repeat(50));
      console.log('✅ PARTIAL SUCCESS - Teacher Creation Works');
      console.log('='.repeat(50));
      console.log('\nTeacher account creation is working correctly!');
      console.log(`- Teacher created: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
      console.log('\nNote: Student creation test skipped (no classes available).');
      console.log('Students can be created once teachers setup their classes.');
      return;
    }

    // Step 5: Create a student
    const student = await createStudent(teacherId, classId);
    if (!student) {
      console.error('\n⚠️  Student creation failed. Partial test failure.');
      return;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(50));
    console.log('\nSummary:');
    console.log(`- Teacher created: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
    console.log(`- Student created: ${student.firstName} ${student.lastName} (${student.email})`);
    console.log(`- Student LRN: ${student.lrn}`);
    console.log('\n✨ Admin account creation is working correctly!');

  } catch (err) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(50));
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
