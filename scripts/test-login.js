#!/usr/bin/env node

const testCredentials = [
  { email: 'student@brightstart.edu', password: 'Student123!', role: 'USER', name: 'Student', mode: 'login' },
  { email: 'teacher@brightstart.edu', password: 'Teacher123!', role: 'TEACHER', name: 'Teacher', mode: 'teacher' },
  { email: 'admin@brightstart.edu', password: 'Admin123!', role: 'ADMIN', name: 'Admin', mode: 'admin' }
];

async function testLogin(email, password, mode) {
  try {
    const response = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: email,
        password: password,
        requestedMode: mode
      })
    });

    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Login API Endpoints\n');
  console.log('═'.repeat(60));

  for (const cred of testCredentials) {
    console.log(`\n📝 Testing ${cred.name} Login (${cred.mode} mode):`);
    console.log(`   Email: ${cred.email}`);
    
    const result = await testLogin(cred.email, cred.password, cred.mode);
    
    if (result.success && result.data.success) {
      console.log(`   ✅ Login Successful!`);
      console.log(`   User ID: ${result.data.user.id}`);
      console.log(`   Role: ${result.data.user.role}`);
      console.log(`   Name: ${result.data.user.firstName} ${result.data.user.lastName}`);
    } else {
      console.log(`   ❌ Login Failed`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.data?.error || result.data?.message || result.error}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n✨ Test Complete!\n');
}

// Wait a bit for the API to be ready
setTimeout(runTests, 1000);
