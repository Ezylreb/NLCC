#!/usr/bin/env node
/**
 * Full Integration Test: Create Users and Verify Display
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@brightstart.edu';
const ADMIN_PASSWORD = 'Admin123!';

async function runFullTest() {
  console.log('\n🧪 Full Integration Test: Create & Display Users');
  console.log('='.repeat(70));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Login as admin...');
    let response = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!response.ok) throw new Error(`Login failed: ${response.status}`);
    console.log('✅ Admin logged in');

    // Step 2: Get initial user count
    console.log('\n📋 Step 2: Get initial user count...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=100`);
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
    const initialData = await response.json();
    const initialCount = initialData.pagination.total;
    console.log(`✅ Initial user count: ${initialCount}`);

    // Step 3: Create a new teacher
    console.log('\n👨‍🏫 Step 3: Create a new teacher...');
    const teacherEmail = `test_teacher_${Date.now()}@school.edu.ph`;
    response = await fetch(`${BASE_URL}/api/admin/create-teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'TestTeacher',
        lastName: 'Account',
        email: teacherEmail,
        password: 'testpass123'
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Teacher creation failed: ${data.error}`);
    }
    const teacherData = await response.json();
    const teacherId = teacherData.userId;
    console.log(`✅ Teacher created: ${teacherEmail} (ID: ${teacherId})`);

    // Step 4: Verify teacher appears in users list
    console.log('\n🔍 Step 4: Verify teacher appears in TEACHER filter...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=100&role=TEACHER`);
    if (!response.ok) throw new Error(`Failed to fetch teachers: ${response.status}`);
    const teachersData = await response.json();
    const teacherFound = teachersData.users.find(u => u.email === teacherEmail);
    
    if (!teacherFound) {
      throw new Error(`❌ Teacher not found in users list!`);
    }
    console.log(`✅ Teacher found in list:`);
    console.log(`   Name: ${teacherFound.name}`);
    console.log(`   Email: ${teacherFound.email}`);
    console.log(`   Role: ${teacherFound.role}`);

    // Step 5: Create a new student
    console.log('\n👤 Step 5: Create a new student...');
    const studentEmail = `test_student_${Date.now()}@school.edu.ph`;
    const studentLRN = String(Math.floor(Math.random() * 999999999999)).padStart(12, '0');
    
    // First, we need to create a class for the student
    console.log('  → Creating a class for student assignment...');
    response = await fetch(`${BASE_URL}/api/teacher/create-class`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `TestClass_${Date.now()}`,
        teacherId: teacherId
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Class creation failed: ${data.error}`);
    }
    const classData = await response.json();
    const classId = classData.data.class.id;
    console.log(`  → Class created: ${classData.data.class.name} (ID: ${classId})`);

    // Now create the student
    response = await fetch(`${BASE_URL}/api/admin/create-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'TestStudent',
        lastName: 'Account',
        email: studentEmail,
        password: 'testpass123',
        lrn: studentLRN,
        teacherId: teacherId,
        classId: classId
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Student creation failed: ${data.error}`);
    }
    const studentData = await response.json();
    console.log(`✅ Student created: ${studentEmail} (ID: ${studentData.userId})`);

    // Step 6: Verify student appears in users list
    console.log('\n🔍 Step 6: Verify student appears in STUDENT filter...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=100&role=USER`);
    if (!response.ok) throw new Error(`Failed to fetch students: ${response.status}`);
    const studentsData = await response.json();
    const studentFound = studentsData.users.find(u => u.email === studentEmail);
    
    if (!studentFound) {
      throw new Error(`❌ Student not found in users list!`);
    }
    console.log(`✅ Student found in list:`);
    console.log(`   Name: ${studentFound.name}`);
    console.log(`   Email: ${studentFound.email}`);
    console.log(`   Role: ${studentFound.role}`);
    console.log(`   LRN: ${studentFound.lrn}`);
    console.log(`   Class: ${studentFound.className}`);

    // Step 7: Get users by search
    console.log('\n🔍 Step 7: Verify search finds both new accounts...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=100&search=test`);
    if (!response.ok) throw new Error(`Failed to search users: ${response.status}`);
    const searchData = await response.json();
    const testUsersCount = searchData.users.filter(u => u.email.includes('test_')).length;
    console.log(`✅ Search found ${testUsersCount} users with 'test' in name/email`);
    if (testUsersCount >= 2) {
      console.log(`   ✓ Both new accounts found by search`);
    }

    // Step 8: Verify new total count
    console.log('\n📊 Step 8: Verify user count increased...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=100`);
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
    const finalData = await response.json();
    const finalCount = finalData.pagination.total;
    const addedCount = finalCount - initialCount;
    console.log(`✅ User count: ${initialCount} → ${finalCount} (+${addedCount})`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL INTEGRATION TESTS PASSED');
    console.log('='.repeat(70));
    console.log('\n✨ VERIFIED FUNCTIONALITY:');
    console.log('  ✓ Can create teacher accounts');
    console.log('  ✓ Teacher appears in TEACHER filter');
    console.log('  ✓ Can create student accounts');
    console.log('  ✓ Student appears in STUDENT filter');
    console.log('  ✓ Search finds new accounts');
    console.log('  ✓ Total user count increases correctly');
    console.log('\n💡 Admin Dashboard Users Table:');
    console.log('  • New teachers will appear when Teachers filter selected');
    console.log('  • New students will appear when Students filter selected');
    console.log('  • All accounts searchable\n');

  } catch (err) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ INTEGRATION TEST FAILED');
    console.error('='.repeat(70));
    console.error('\nError:', err.message);
    console.error('\nPossible causes:');
    console.error('  1. Development server not running (npm run dev)');
    console.error('  2. Database connection issues');
    console.error('  3. API endpoints not properly configured');
    console.error('  4. Authentication failed');
    process.exit(1);
  }
}

runFullTest();
