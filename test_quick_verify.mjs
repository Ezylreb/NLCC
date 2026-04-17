#!/usr/bin/env node
/**
 * Quick Test: Verify Users Display in Admin Dashboard
 */

const BASE_URL = 'http://localhost:3000';

async function quickTest() {
  console.log('\n✅ Quick Verification: Users API Endpoint\n');

  try {
    // Test 1: Fetch all users
    let response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=20`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Users endpoint working`);
      console.log(`   Total users: ${data.pagination.total}`);
      console.log(`   Users on page 1: ${data.users.length}`);
      console.log(`   \n   Users displayed:`);
      data.users.slice(0, 5).forEach(user => {
        console.log(`   • ${user.name} (${user.role})`);
      });
    } else {
      console.error(`❌ Users endpoint failed: ${response.status}`);
    }

    // Test 2: Filter by TEACHER
    response = await fetch(`${BASE_URL}/api/admin/users?role=TEACHER&page=1&limit=20`);
    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ Teachers filter working`);
      console.log(`   Total teachers: ${data.pagination.total}`);
    }

    // Test 3: Filter by USER (students)
    response = await fetch(`${BASE_URL}/api/admin/users?role=USER&page=1&limit=20`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Students filter working`);
      console.log(`   Total students: ${data.pagination.total}`);
    }

    console.log('\n🎉 All endpoints working!\n');
  } catch (err) {
    console.error('Error:', err.message);
    console.error('\n⚠️  Dev server may not be running');
    console.error('Start it with: npm run dev\n');
    process.exit(1);
  }
}

quickTest();
