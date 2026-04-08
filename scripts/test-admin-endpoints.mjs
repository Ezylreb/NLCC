#!/usr/bin/env node

// Test script for Admin Dashboard API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

const testCases = [
  {
    name: 'Create Student Account',
    endpoint: '/api/admin/create-student',
    payload: {
      firstName: 'Test',
      lastName: 'Student',
      email: `student_${Date.now()}@example.com`,
      password: 'TestPass123!',
      lrn: '123456789012',
      className: 'Grade 1'
    }
  },
  {
    name: 'Create Teacher Account',
    endpoint: '/api/admin/create-teacher',
    payload: {
      firstName: 'Test',
      lastName: 'Teacher',
      email: `teacher_${Date.now()}@example.com`,
      password: 'TestPass123!',
      className: 'Grade 1'
    }
  }
];

async function runTests() {
  console.log('🧪 Testing Admin Dashboard API Endpoints\n');
  console.log(`📡 Base URL: ${BASE_URL}\n`);
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Endpoint: ${testCase.endpoint}`);
    
    try {
      const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`   ✅ PASSED (Status ${response.status})`);
        console.log(`   UserId: ${data.userId}`);
        passed++;
      } else {
        console.log(`   ❌ FAILED (Status ${response.status})`);
        console.log(`   Error: ${data.error}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ FAILED - Connection Error`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✨ All tests passed! Admin Dashboard should be working now.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
}

runTests().catch(console.error);
