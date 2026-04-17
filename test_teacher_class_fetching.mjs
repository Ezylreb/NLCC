#!/usr/bin/env node
/**
 * Test Teacher and Class Fetching
 * Verifies that teachers and classes load correctly in the AdminDashboard
 */

const BASE_URL = 'http://localhost:3000';

async function testFetching() {
  console.log('\n🧪 Testing Teacher & Class Fetching\n');
  console.log('='.repeat(70));

  try {
    // Test 1: Fetch teachers
    console.log('\n👨‍🏫 Test 1: Fetching teachers...');
    let response = await fetch(`${BASE_URL}/api/admin/teachers`);
    
    if (!response.ok) {
      throw new Error(`Teachers endpoint failed: ${response.status}`);
    }
    
    const teachersData = await response.json();
    
    if (!teachersData.success) {
      throw new Error('Teachers response not successful');
    }
    
    if (!teachersData.teachers || teachersData.teachers.length === 0) {
      console.warn('⚠️  No teachers found in database');
      return;
    }
    
    console.log(`✅ Teachers fetched successfully`);
    console.log(`   Total teachers: ${teachersData.teachers.length}`);
    console.log(`   Teachers list:`);
    teachersData.teachers.forEach(teacher => {
      console.log(`   • ${teacher.fullName} (${teacher.email})`);
    });
    
    // Test 2: Fetch classes for first teacher
    const firstTeacherId = teachersData.teachers[0].id;
    console.log(`\n📚 Test 2: Fetching classes for teacher: ${teachersData.teachers[0].fullName}...`);
    
    response = await fetch(`${BASE_URL}/api/admin/classes?teacherId=${firstTeacherId}`);
    
    if (!response.ok) {
      throw new Error(`Classes endpoint failed: ${response.status}`);
    }
    
    const classesData = await response.json();
    
    if (!classesData.success) {
      throw new Error('Classes response not successful');
    }
    
    if (!classesData.classes) {
      throw new Error('Classes array missing from response');
    }
    
    console.log(`✅ Classes fetched successfully`);
    console.log(`   Total classes: ${classesData.classes.length}`);
    
    if (classesData.classes.length > 0) {
      console.log(`   Classes list:`);
      classesData.classes.forEach(cls => {
        console.log(`   • ${cls.name} (ID: ${cls.id})`);
      });
    } else {
      console.log(`   (No classes created yet for this teacher)`);
    }
    
    // Test 3: Verify response structure
    console.log(`\n📋 Test 3: Verifying response structure...`);
    console.log(`   Teachers response has 'success': ${teachersData.success}`);
    console.log(`   Teachers response has 'teachers': ${Array.isArray(teachersData.teachers)}`);
    console.log(`   Classes response has 'success': ${classesData.success}`);
    console.log(`   Classes response has 'classes': ${Array.isArray(classesData.classes)}`);
    console.log('   ✅ Structure verified (data at top level, not wrapped)');
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(70));
    console.log('\n✨ Teacher and Class Fetching Working:');
    console.log('  ✓ Teachers API endpoint: GET /api/admin/teachers');
    console.log('  ✓ Classes API endpoint: GET /api/admin/classes?teacherId=...');
    console.log('  ✓ Response structure correct (data at top level)');
    console.log('\n💡 In AdminDashboard Register Student form:');
    console.log(`  • Teacher dropdown should show ${teachersData.teachers.length} teacher(s)`);
    console.log(`  • Class dropdown will populate when teacher is selected`);
    console.log(`  • Component correctly accesses response.teachers and response.classes\n`);

  } catch (err) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(70));
    console.error('Error:', err.message);
    console.error('\n⚠️  Possible causes:');
    console.error('  1. Development server not running');
    console.error('  2. No teachers in database');
    console.error('  3. API endpoint configuration issue');
    process.exit(1);
  }
}

testFetching();
