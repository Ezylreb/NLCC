#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

console.log('🔍 Connection Details:');
console.log(`   URL: ${connectionString ? connectionString.substring(0, 50) + '...' : 'NOT SET'}`);
console.log('');

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL or DATABASE_URL not set');
  console.error('Make sure .env.local exists and contains database configuration');
  process.exit(1);
}

// Add libpqcompat for SSL compatibility
if (!connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  console.log('🚀 Setting up BrightStart database...\n');

  const client = await pool.connect();

  try {
    // First, create the users table if it doesn't exist
    console.log('📋 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready\n');

    // Define test users
    const testUsers = [
      {
        email: 'student@brightstart.edu',
        password: 'Student123!',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        role: 'USER'
      },
      {
        email: 'teacher@brightstart.edu',
        password: 'Teacher123!',
        firstName: 'Maria',
        lastName: 'Santos',
        role: 'TEACHER'
      },
      {
        email: 'admin@brightstart.edu',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      }
    ];

    console.log('👥 Adding test users...\n');

    for (const user of testUsers) {
      try {
        // Check if user already exists
        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );

        if (existing.rows.length > 0) {
          console.log(`  ⏭️  ${user.email} already exists (skipped)`);
          continue;
        }

        // Insert new user
        const result = await client.query(
          'INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [user.firstName, user.lastName, user.email, user.password, user.role]
        );

        console.log(`  ✅ Created ${user.role === 'USER' ? '👨‍🎓 Student' : user.role === 'TEACHER' ? '👨‍🏫 Teacher' : '👨‍💼 Admin'}: ${user.email}`);
        console.log(`      Password: ${user.password}`);
      } catch (err) {
        console.error(`  ❌ Error creating ${user.email}:`, err.message);
      }
    }

    console.log('\n🎉 Database setup complete!\n');
    console.log('✨ Test Credentials:');
    console.log('-'.repeat(50));
    console.log('👨‍🎓 Student: student@brightstart.edu / Student123!');
    console.log('👨‍🏫 Teacher: teacher@brightstart.edu / Teacher123!');
    console.log('👨‍💼 Admin: admin@brightstart.edu / Admin123!');
    console.log('-'.repeat(50));

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nCheck that:');
    console.error('1. POSTGRES_URL is set in .env.local');
    console.error('2. Database server is accessible');
    console.error('3. Connection credentials are correct');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
