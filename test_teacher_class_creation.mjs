#!/usr/bin/env node

/**
 * Test Teacher Class Creation Flow
 * 
 * Comprehensive test that:
 * 1. Verifies the API endpoint works correctly
 * 2. Checks database for created class
 * 3. Verifies enrollment records created
 * 4. Tests student visibility (if students exist)
 */

import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';
const TEST_CLASS_NAME = `Test Class ${Date.now()}`;

// Parse connection string
let connStr = process.env.DATABASE_URL;
if (connStr && !connStr.includes('sslmode')) {
  connStr += (connStr.includes('?') ? '&' : '?') + 'sslmode=disable';
}

let dbClient = null;

async function connectDB() {
  dbClient = new Client({ connectionString: connStr });
  await dbClient.connect();
}

async function getTeacherID() {
  const result = await dbClient.query(`
    SELECT id, name, email FROM users 
    WHERE role = 'teacher' 
    LIMIT 1
  `);
  return result.rows[0];
}

async function classExists(classId) {
  const result = await dbClient.query(
    'SELECT * FROM classes WHERE id = $1',
    [classId]
  );
  return result.rows[0];
}

async function getEnrollmentsForClass(classId) {
  const result = await dbClient.query(
    `SELECT ce.*, u.name as student_name, u.email as student_email
     FROM class_enrollments ce
     JOIN users u ON ce.student_id = u.id
     WHERE ce.class_id = $1`,
    [classId]
  );
  return result.rows;
}

async function createClassViaAPI(teacherId, className) {
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
}

async function runTests() {
  console.log('\n🧪 Testing Teacher Class Creation Flow');
  console.log('='.repeat(70));

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Connect to database
    console.log('\n📦 Connecting to database...');
    await connectDB();
    console.log('✅ Connected\n');

    // Get a test teacher
    console.log('🔍 Finding test teacher...');
    const teacher = await getTeacherID();
    if (!teacher) {
      console.error('❌ No teachers found in database');
      return;
    }
    console.log(`✅ Found teacher: ${teacher.name} (${teacher.email})`);
    console.log(`   ID: ${teacher.id}\n`);

    // TEST 1: Create class via API
    console.log('TEST 1️⃣  Create Class via API');
    console.log('-'.repeat(70));
    console.log(`Creating class: "${TEST_CLASS_NAME}"`);

    const createResponse = await createClassViaAPI(teacher.id, TEST_CLASS_NAME);
    console.log(`Status Code: ${createResponse.status}`);

    if (createResponse.status === 200) {
      console.log('✅ API returned 200 OK');
      testsPassed++;
    } else {
      console.log(`❌ API returned ${createResponse.status}`);
      console.log('Response:', JSON.stringify(createResponse.data, null, 2));
      testsFailed++;
      return;
    }

    const classData = createResponse.data?.data?.class;
    const classId = classData?.id;

    if (!classId) {
      console.log('❌ No classId in response');
      console.log('Response:', JSON.stringify(createResponse.data, null, 2));
      testsFailed++;
      return;
    }

    console.log(`✅ Class ID: ${classId}`);
    console.log(`   Name: ${classData?.name}`);
    console.log(`   Student Count: ${classData?.student_count}`);
    console.log(`   Lesson Count: ${classData?.lesson_count}\n`);

    // TEST 2: Verify class exists in database
    console.log('TEST 2️⃣  Verify Class in Database');
    console.log('-'.repeat(70));

    const dbClass = await classExists(classId);
    if (dbClass) {
      console.log('✅ Class found in database');
      console.log(`   ID: ${dbClass.id}`);
      console.log(`   Name: ${dbClass.name}`);
      console.log(`   Teacher ID: ${dbClass.teacher_id}`);
      console.log(`   Created: ${dbClass.created_at}`);
      testsPassed++;
    } else {
      console.log('❌ Class NOT found in database');
      testsFailed++;
      return;
    }

    // TEST 3: Verify student enrollment records
    console.log('\nTEST 3️⃣  Verify Student Enrollment Records');
    console.log('-'.repeat(70));

    const enrollments = await getEnrollmentsForClass(classId);
    console.log(`Found ${enrollments.length} enrollment record(s)`);

    if (enrollments.length > 0) {
      console.log('✅ Enrollment records created');
      enrollments.forEach((e, idx) => {
        console.log(`   ${idx + 1}. ${e.student_name} (${e.student_email})`);
      });
      testsPassed++;
    } else {
      console.log('⚠️  No enrollment records found');
      console.log(`   (Might be intentional if no students assigned to this teacher)\n`);
      
      // Check how many students exist
      const studentCount = await dbClient.query(
        'SELECT COUNT(*) as count FROM users WHERE role = \'student\''
      );
      console.log(`   Total students in system: ${studentCount.rows[0].count}`);
      testsFailed++;
    }

    // TEST 4: Verify response format
    console.log('\nTEST 4️⃣  Verify Response Format');
    console.log('-'.repeat(70));

    const hasSuccess = 'success' in createResponse.data;
    const hasData = 'data' in createResponse.data;
    const hasClass = 'class' in (createResponse.data?.data || {});

    console.log(`Response structure:`);
    console.log(`  ✅ Has 'success' field: ${hasSuccess}`);
    console.log(`  ✅ Has 'data' field: ${hasData}`);
    console.log(`  ✅ Has 'class' in data: ${hasClass}`);

    if (hasSuccess && hasData && hasClass) {
      testsPassed++;
    } else {
      testsFailed++;
    }

    // SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log(`📊 TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('='.repeat(70));

    if (testsFailed === 0) {
      console.log('\n✅ All tests passed! Teacher class creation is working.\n');
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed. Review the output above.\n`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  } finally {
    if (dbClient) await dbClient.end();
  }
}

runTests();
