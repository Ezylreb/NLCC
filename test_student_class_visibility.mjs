#!/usr/bin/env node

/**
 * Test Student Portal - Class Visibility
 * 
 * Tests that students can see classes created by teachers
 */

const BASE_URL = 'http://localhost:3000';

// Test data (from previous successful teacher creation)
const TEST_CLASS_ID = '7191602d-1363-45dc-904d-005f8887f3f8';
const TEST_TEACHER_ID = 'ba70c802-29ac-421d-b5c9-863486d7312e';

async function getStudents() {
  try {
    const response = await fetch(`${BASE_URL}/api/rest/users?role=student`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.log('Note: Could not fetch students via /api/rest/users');
    return null;
  }
}

async function getEnrolledClasses(studentId) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/student/enrolled-classes?studentId=${studentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-student-id': studentId
        }
      }
    );
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 'ERROR', error: error.message };
  }
}

async function runTests() {
  console.log('\n🧪 Testing Student Portal - Class Visibility');
  console.log('='.repeat(70));
  console.log(`📝 Test Class ID: ${TEST_CLASS_ID}`);
  console.log(`👨‍🏫 Teacher ID: ${TEST_TEACHER_ID}`);
  console.log(`🌍 API URL: ${BASE_URL}\n`);

  // Test 1: Try to get a list of students
  console.log('TEST 1️⃣  Find Available Students');
  console.log('-'.repeat(70));

  const studentsResponse = await getStudents();
  let testStudent = null;

  if (studentsResponse && studentsResponse.length > 0) {
    testStudent = studentsResponse[0];
    console.log(`✅ Found ${studentsResponse.length} students`);
    console.log(`📍 Testing with student: ${testStudent.name || testStudent.email}`);
    console.log(`   ID: ${testStudent.id}\n`);
  } else {
    // Fallback to a known student ID if available
    console.log('⚠️  Could not fetch student list');
    console.log('Note: May need specific student ID to test\n');
    
    // Try some common test IDs
    const commonTestIds = [
      'test-student-123',
      '00000000-0000-0000-0000-000000000001',
      '550e8400-e29b-41d4-a716-446655440000'
    ];
    
    console.log('Trying common test student IDs...\n');
    
    for (const testId of commonTestIds) {
      const result = await getEnrolledClasses(testId);
      console.log(`Testing ID: ${testId}`);
      console.log(`  Status: ${result.status}`);
      
      if (result.status === 200) {
        testStudent = { id: testId };
        console.log(`  ✅ Found valid student ID!\n`);
        break;
      } else if (result.status === 'ERROR') {
        console.log(`  ❌ Error: ${result.error}\n`);
      } else {
        console.log(`  Response: ${JSON.stringify(result.data).substring(0, 80)}...\n`);
      }
    }
  }

  if (!testStudent) {
    console.log('❌ Could not identify a test student.');
    console.log('Please provide a student ID or create one first.\n');
    return;
  }

  // Test 2: Get enrolled classes for student
  console.log('TEST 2️⃣  Fetch Enrolled Classes for Student');
  console.log('-'.repeat(70));
  console.log(`Student: ${testStudent.id}`);

  const enrolledResponse = await getEnrolledClasses(testStudent.id);

  console.log(`HTTP Status: ${enrolledResponse.status}`);

  if (enrolledResponse.status === 200) {
    console.log('✅ Endpoint returned 200 OK');
    
    const classes = enrolledResponse.data?.data || enrolledResponse.data || [];
    console.log(`\n✅ Student has ${Array.isArray(classes) ? classes.length : 0} enrolled class(es)\n`);

    if (Array.isArray(classes) && classes.length > 0) {
      console.log('Classes:');
      classes.forEach((cls, idx) => {
        console.log(`  ${idx + 1}. ${cls.name || cls.title || 'Unknown'}`);
        console.log(`     ID: ${cls.id}`);
        if (cls.teacher_id) console.log(`     Teacher ID: ${cls.teacher_id}`);
        if (cls.created_at) console.log(`     Created: ${cls.created_at}`);
      });

      // Check if our test class is in the list
      const hasTestClass = classes.some(cls => cls.id === TEST_CLASS_ID);
      console.log(`\n📍 Test Class (${TEST_CLASS_ID}) visible to student: ${hasTestClass ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('⚠️  Student has no enrolled classes yet.');
      console.log('Note: This might be expected if student is not assigned to the teacher.');
    }
  } else {
    console.log(`❌ Endpoint returned status ${enrolledResponse.status}`);
    console.log('Response:', JSON.stringify(enrolledResponse.data, null, 2));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test completed!\n');
}

runTests();
