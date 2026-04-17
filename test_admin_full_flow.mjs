#!/usr/bin/env node
/**
 * Comprehensive Admin Account Creation Test
 * Tests teacher creation, class creation, and student creation
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@brightstart.edu';
const ADMIN_PASSWORD = 'Admin123!';

async function login() {
  console.log('\n📝 Login as admin...');
  const response = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!response.ok) throw new Error(`Login failed: ${response.status}`);
  const data = await response.json();
  console.log('✅ Admin logged in');
  return data;
}

async function createTeacher() {
  console.log('\n👨‍🏫 Creating teacher account...');
  const teacherData = {
    firstName: 'Maria',
    lastName: 'Garcia',
    email: `teacher_${Date.now()}@school.edu.ph`,
    password: 'teacher123'
  };

  const response = await fetch(`${BASE_URL}/api/admin/create-teacher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacherData)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Teacher creation failed: ${data.error}`);
  }

  const data = await response.json();
  console.log(`✅ Teacher created: ${teacherData.firstName} ${teacherData.lastName}`);
  console.log(`   Email: ${teacherData.email}`);
  return { ...teacherData, id: data.userId };
}

async function createClass(teacherId, className) {
  console.log(`\n📚 Creating class "${className}" for teacher...`);
  const classData = { name: className, teacherId };

  const response = await fetch(`${BASE_URL}/api/teacher/create-class`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(classData)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Class creation failed: ${data.error}`);
  }

  const data = await response.json();
  console.log(`✅ Class created: ${className}`);
  return data.data.class.id;
}

async function createStudent(teacherId, classId) {
  console.log('\n👤 Creating student account...');
  const studentData = {
    firstName: 'Jose',
    lastName: 'Santos',
    email: `student_${Date.now()}@school.edu.ph`,
    password: 'student123',
    lrn: String(Math.floor(Math.random() * 999999999999)).padStart(12, '0'),
    teacherId: teacherId,  // Changed from teacher_id to teacherId
    classId: classId         // Changed from class_id to classId
  };

  const response = await fetch(`${BASE_URL}/api/admin/create-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Student creation failed: ${data.error}`);
  }

  const data = await response.json();
  console.log(`✅ Student created: ${studentData.firstName} ${studentData.lastName}`);
  console.log(`   Email: ${studentData.email}`);
  console.log(`   LRN: ${studentData.lrn}`);
  return { ...studentData, id: data.userId };
}

async function runTests() {
  console.log('🧪 Comprehensive Admin Account Creation Tests');
  console.log('='.repeat(60));

  try {
    // Step 1: Login
    await login();

    // Step 2: Create teacher
    const teacher = await createTeacher();

    // Step 3: Create class for teacher
    const classId = await createClass(teacher.id, 'Kindergarten 1');

    // Step 4: Create student
    const student = await createStudent(teacher.id, classId);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED - ADMIN ACCOUNT CREATION WORKING');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`✓ Teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
    console.log(`✓ Class: Kindergarten 1 (ID: ${classId})`);
    console.log(`✓ Student: ${student.firstName} ${student.lastName} (${student.email})`);
    console.log(`✓ Student LRN: ${student.lrn}`);
    console.log('\n✨ Admin dashboard account creation is fully operational!');

  } catch (err) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('\nError:', err.message);
    process.exit(1);
  }
}

runTests();
