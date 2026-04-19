import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, className } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the teacher user
    const insertRes = await query(
      'INSERT INTO users (first_name, last_name, email, password, role, class_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
      [firstName, lastName, email, hashedPassword, 'TEACHER', className || null]
    );
    const userId = insertRes.rows[0].id;

    // Log the activity
    try {
      await query(
        "INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)",
        [userId, 'Teacher Registered', 'system', `Admin created teacher: ${firstName} ${lastName} (${email})`]
      );
    } catch (err) {
      console.warn('Could not log teacher activity:', err);
    }

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Admin Create Teacher Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
