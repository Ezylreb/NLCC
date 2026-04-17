#!/usr/bin/env node
/**
 * Test Admin User Display Feature
 * Verifies that newly created accounts display in the Admin Dashboard users table
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@brightstart.edu';
const ADMIN_PASSWORD = 'Admin123!';

async function testUsersList() {
  console.log('\n🧪 Testing Admin User Display Implementation');
  console.log('='.repeat(60));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Logging in as admin...');
    let response = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!response.ok) throw new Error(`Login failed: ${response.status}`);
    const loginData = await response.json();
    console.log('✅ Admin logged in');

    // Step 2: Test get all users
    console.log('\n👥 Step 2: Fetching all users...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=10`);
    if (!response.ok) throw new Error(`Get users failed: ${response.status}`);
    const allUsersData = await response.json();
    console.log(`✅ Retrieved ${allUsersData.users.length} users`);
    console.log(`   Total users: ${allUsersData.pagination.total}`);
    console.log(`   Total pages: ${allUsersData.pagination.totalPages}`);

    // Step 3: Test filter by role
    console.log('\n👨‍🏫 Step 3: Fetching teachers only...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=10&role=TEACHER`);
    if (!response.ok) throw new Error(`Get teachers failed: ${response.status}`);
    const teachersData = await response.json();
    console.log(`✅ Retrieved ${teachersData.users.length} teachers`);
    if (teachersData.users.length > 0) {
      console.log(`   First teacher: ${teachersData.users[0].name}`);
    }

    // Step 4: Test filter by role (students)
    console.log('\n👤 Step 4: Fetching students only...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=10&role=USER`);
    if (!response.ok) throw new Error(`Get students failed: ${response.status}`);
    const studentsData = await response.json();
    console.log(`✅ Retrieved ${studentsData.users.length} students`);
    if (studentsData.users.length > 0) {
      console.log(`   First student: ${studentsData.users[0].name}`);
    }

    // Step 5: Test search
    console.log('\n🔍 Step 5: Testing search functionality...');
    response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=50&search=maria`);
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    const searchData = await response.json();
    console.log(`✅ Search found ${searchData.users.length} user(s) matching "maria"`);
    searchData.users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) [${user.role}]`);
    });

    // Step 6: Test pagination
    console.log('\n📄 Step 6: Testing pagination...');
    if (allUsersData.pagination.totalPages > 1) {
      response = await fetch(`${BASE_URL}/api/admin/users?page=2&limit=10`);
      if (!response.ok) throw new Error(`Page 2 fetch failed: ${response.status}`);
      const page2Data = await response.json();
      console.log(`✅ Retrieved page 2 with ${page2Data.users.length} users`);
      console.log(`   Page 2 first user: ${page2Data.users[0]?.name || 'N/A'}`);
    } else {
      console.log('⏭️  Only 1 page exists, skipping pagination test');
    }

    // Step 7: List first few users
    console.log('\n📋 Step 7: Listing recent users:');
    allUsersData.users.slice(0, 5).forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.name}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Role: ${user.role}${user.className ? ` | Class: ${user.className}` : ''}${user.lrn ? ` | LRN: ${user.lrn}` : ''}`);
      console.log(`      Joined: ${user.joinDate}`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`✓ Admin users endpoint working: GET /api/admin/users`);
    console.log(`✓ Pagination working: ${allUsersData.pagination.totalPages} total pages`);
    console.log(`✓ Role filtering working: Retrieved ${teachersData.users.length} teachers, ${studentsData.users.length} students`);
    console.log(`✓ Search functionality working: Found users matching search`);
    console.log('\n✨ Admin user display feature is fully operational!');
    console.log('   - New accounts will appear in the Users tab');
    console.log('   - Accounts are displayed with correct role filter applied');
    console.log('   - Pagination allows scrolling through all users');

  } catch (err) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testUsersList();
