#!/usr/bin/env node
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'nlcc_user',
  password: 'nlcc_password',
  host: 'localhost',
  port: 5432,
  database: 'nlcc_db'
});

async function checkAdmins() {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, role, password FROM users WHERE role=\'ADMIN\' LIMIT 5');
    console.log('Admin users in database:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAdmins();
