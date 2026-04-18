import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

let connectionString = process.env.DATABASE_URL;

// Add libpqcompat for SSL compatibility with Supabase
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function debugPassword() {
  try {
    // First, check all users
    const allUsers = await pool.query(
      `SELECT id, first_name, last_name, email, role 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    console.log('\n📋 All Recent Users:');
    console.log('='.repeat(80));
    allUsers.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name} (${user.role}) - ${user.email}`);
    });

    // Find student user - they have role 'USER'
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, password, role 
       FROM users 
       WHERE role = 'USER' 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    if (result.rows.length === 0) {
      console.log('\n❌ No student users found');
      await pool.end();
      return;
    }

    console.log('\n📋 Student Users:');
    console.log('='.repeat(80));
    
    result.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. Student: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Password Hash: ${user.password.substring(0, 30)}...`);
      
      // Test common passwords
      const testPasswords = ['Student123!', 'Student123', 'student123!', 'Student1!'];
      console.log('   Testing passwords:');
      testPasswords.forEach(pwd => {
        const match = bcrypt.compareSync(pwd, user.password);
        console.log(`     "${pwd}": ${match ? '✅ MATCH' : '❌ No match'}`);
      });
    });

    console.log('\n' + '='.repeat(80));
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

debugPassword();
