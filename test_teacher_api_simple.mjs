#!/usr/bin/env node

/**
 * Simple Teacher Class Creation API Test
 * 
 * Tests only the HTTP API endpoint without database verification
 * Good for quick validation of endpoint response structure
 */

const BASE_URL = 'http://localhost:3000';
const TEST_CLASS_NAME = `Test Class ${Date.now()}`;

// Test teacher IDs (from previous logs)
const TEST_TEACHERS = [
  { id: 'ba70c802-29ac-421d-b5c9-863486d7312e', name: 'From Previous Logs' },
];

async function createClassViaAPI(teacherId, className) {
  try {
    const response = await fetch(`${BASE_URL}/api/teacher/create-class`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: className,
        teacher_id: teacherId
      })
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 'ERROR', error: error.message };
  }
}

async function runTests() {
  console.log('\n🧪 Testing Teacher Class Creation API');
  console.log('='.repeat(70));
  console.log(`📝 Test Class Name: "${TEST_CLASS_NAME}"`);
  console.log(`🌍 API URL: ${BASE_URL}\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  for (const teacher of TEST_TEACHERS) {
    console.log(`Testing with Teacher: ${teacher.name}`);
    console.log(`ID: ${teacher.id}`);
    console.log('-'.repeat(70));

    const response = await createClassViaAPI(teacher.id, TEST_CLASS_NAME);

    if (response.status === 'ERROR') {
      console.log(`❌ Network Error: ${response.error}`);
      testsFailed++;
      continue;
    }

    console.log(`HTTP Status: ${response.status}`);

    // Test: Status should be 200
    if (response.status === 200) {
      console.log('✅ Correct status code (200)');
      testsPassed++;
    } else {
      console.log(`❌ Wrong status code (expected 200, got ${response.status})`);
      testsFailed++;
    }

    // Test: Response structure
    console.log('\nResponse Structure:');
    const has_success = 'success' in response.data;
    const has_data = 'data' in response.data;
    const has_class = has_data && 'class' in response.data.data;

    console.log(`  "success" field: ${has_success ? '✅' : '❌'}`);
    console.log(`  "data" field: ${has_data ? '✅' : '❌'}`);
    console.log(`  "data.class" field: ${has_class ? '✅' : '❌'}`);

    if (has_success && has_data && has_class) {
      testsPassed++;
    } else {
      testsFailed++;
    }

    // Show class data if available
    const classData = response.data?.data?.class;
    if (classData) {
      console.log('\nClass Data Returned:');
      console.log(`  ID: ${classData.id}`);
      console.log(`  Name: ${classData.name}`);
      console.log(`  Student Count: ${classData.student_count}`);
      console.log(`  Lesson Count: ${classData.lesson_count}`);
      console.log(`  Progress: ${classData.progress}`);
      console.log(`  Archived: ${classData.is_archived}`);
      testsPassed++;
    } else {
      console.log('\n❌ No class data in response');
      console.log('Full Response:', JSON.stringify(response.data, null, 2));
      testsFailed++;
    }

    console.log('\n' + '='.repeat(70) + '\n');
  }

  // Summary
  console.log(`📊 SUMMARY: ${testsPassed} checks passed, ${testsFailed} failed\n`);

  if (testsFailed === 0) {
    console.log('✅ All API tests passed!\n');
  } else {
    console.log(`⚠️  Some tests failed. Review output above.\n`);
  }
}

runTests();
