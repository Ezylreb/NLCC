#!/usr/bin/env node
/**
 * Check admin login
 */

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('Testing login...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: 'admin@brightstart.edu', password: 'admin123' })
    });

    console.log('Status:', response.status);
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    try {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      const text = await response.text();
      console.log('Response (text):', text);
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

testLogin();
