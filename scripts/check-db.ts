#!/usr/bin/env node
import { query } from '../lib/db';

async function checkDatabase() {
  console.log('🔍 Checking database connection and users...\n');

  try {
    // Test connection
    console.log('Testing database connection...');
    const testRes = await query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Check users table exists
    console.log('Checking users table...');
    const tableRes = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableRes.rows.length === 0) {
      console.log('❌ Users table does not exist\n');
      console.log('You need to create it first:');
      console.log(`
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
      `);
      return;
    }

    console.log('✅ Users table exists\n');

    // List all users
    console.log('Current users in database:');
    const usersRes = await query('SELECT id, email, first_name, last_name, role FROM users');
    
    if (usersRes.rows.length === 0) {
      console.log('❌ No users found in database\n');
      console.log('Run the seed script to add test users:');
      console.log('node scripts/seed-users.mjs\n');
    } else {
      console.log(`Found ${usersRes.rows.length} user(s):\n`);
      usersRes.rows.forEach((user: any) => {
        console.log(`  📧 ${user.email}`);
        console.log(`     Name: ${user.first_name} ${user.last_name}`);
        console.log(`     Role: ${user.role}\n`);
      });
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. POSTGRES_URL environment variable is set');
    console.error('2. Database server is running');
    console.error('3. Connection credentials are correct');
  }
}

checkDatabase();
