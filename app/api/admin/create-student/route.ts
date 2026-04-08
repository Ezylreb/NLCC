import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, lrn, className } = await request.json();

    if (!firstName || !lastName || !email || !password || !lrn) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (lrn.length > 12) {
      return NextResponse.json({ error: 'LRN cannot exceed 12 digits' }, { status: 400 });
    }
    
    if (lrn.length < 12) {
      return NextResponse.json({ error: 'LRN must be exactly 12 digits' }, { status: 400 });
    }

    // Check if email or LRN already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1 OR lrn = $2', [email, lrn]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email or LRN already exists' }, { status: 400 });
    }

    // Create the student user
    const insertRes = await query(
      'INSERT INTO users (first_name, last_name, email, password, lrn, role, class_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id',
      [firstName, lastName, email, password, lrn, 'USER', className || null]
    );
    const userId = insertRes.rows[0].id;

    // Create default preferences
    await query(
      'INSERT INTO preferences (user_id, dark_mode, sound_effects, learning_language, daily_goal) VALUES ($1, $2, $3, $4, $5)',
      [userId, false, true, 'tl', 20]
    );

    // Create default notifications
    await query(
      'INSERT INTO notifications (user_id, daily_reminders, friend_activity, weekly_report) VALUES ($1, $2, $3, $4)',
      [userId, true, true, true]
    );

    // Log the activity
    try {
      await query(
        "INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)",
        [userId, 'Student Registered', 'system', `Admin created student: ${firstName} ${lastName} (LRN: ${lrn})`]
      );
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Admin Create Student Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
