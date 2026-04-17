#!/usr/bin/env node

/**
 * Debug Teacher-Student Relationships
 * 
 * Checks:
 * 1. What students exist and their teacher assignments
 * 2. What classes exist
 * 3. What enrollment records exist
 * 4. Why students might not see classes
 */

const BASE_URL = 'http://localhost:3000';

async function debugTeacherStudentRelationship() {
  console.log('\n🔍 Debugging Teacher-Student Relationships');
  console.log('='.repeat(70));

  const TEACHER_ID = 'ba70c802-29ac-421d-b5c9-863486d7312e';
  const CLASS_ID = '7191602d-1363-45dc-904d-005f8887f3f8';

  // Get teacher info
  console.log('\nStep 1️⃣  Verify Teacher Exists');
  console.log('-'.repeat(70));

  try {
    const teacherResponse = await fetch(
      `${BASE_URL}/api/rest/users?id=${TEACHER_ID}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    const teacherData = await teacherResponse.json();
    console.log('Teacher lookup response:', JSON.stringify(teacherData, null, 2).substring(0, 200));
  } catch (e) {
    console.log('Could not fetch teacher info');
  }

  // Try to get class info via teacher stats endpoint
  console.log('\nStep 2️⃣  Verify Class Exists');
  console.log('-'.repeat(70));
  console.log(`Looking for class: ${CLASS_ID}\n`);

  try {
    const classResponse = await fetch(
      `${BASE_URL}/api/teacher/stats?teacher_id=${TEACHER_ID}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    const classData = await classResponse.json();
    console.log('Teacher stats response:');
    console.log(JSON.stringify(classData, null, 2));
  } catch (e) {
    console.log('Could not fetch teacher stats');
  }

  // Test the enrollment query directly by checking what a known student sees
  console.log('\nStep 3️⃣  Test Student Enrollment Endpoint');
  console.log('-'.repeat(70));

  // Use the teacher ID as student ID to see if they see their own class (unlikely but let's try)
  try {
    const studentClassResponse = await fetch(
      `${BASE_URL}/api/student/enrolled-classes?studentId=${TEACHER_ID}`,
      { 
        method: 'GET', 
        headers: { 
          'Content-Type': 'application/json',
          'x-student-id': TEACHER_ID
        } 
      }
    );
    const studentClassData = await studentClassResponse.json();
    console.log(`Classes visible to teacher ID as student ${TEACHER_ID}:`);
    console.log(JSON.stringify(studentClassData, null, 2));
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Try to test with enrollment directly
  console.log('\nStep 4️⃣  Simulate Student Seeing Class');
  console.log('-'.repeat(70));
  console.log('Issue: We need a student that is:');
  console.log('  1. Assigned to the teacher (teacher_id = ' + TEACHER_ID + ')');
  console.log('  2. Has class_enrollments record for class ' + CLASS_ID);
  console.log('\n⏳ Without database access, cannot verify enrollment records exist.');
  console.log('\n💡 Possible Issues:');
  console.log('  A. Enrollments were NOT created (despite server log saying they were)');
  console.log('  B. Student is NOT assigned to teacher (teacher_id mismatch in users table)');
  console.log('  C. Enrollment query has a syntax error');
  console.log('  D. Test student ID is not valid\n');

  console.log('='.repeat(70));
  console.log('✅ Debug completed. Check server logs and database directly.\n');
}

debugTeacherStudentRelationship();
