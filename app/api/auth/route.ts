import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { action, email, password, firstName, lastName, requestedMode } = await request.json();

    if (action === 'signup') {
      // Check if user exists
      const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Create new user
      const insertRes = await query(
        'INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [firstName || '', lastName || '', email, password, 'USER']
      );
      const user = insertRes.rows[0];
      const userId = user.id;

      // Create default preferences (if table exists)
      try {
        await query(
          'INSERT INTO preferences (user_id, dark_mode, sound_effects, learning_language, daily_goal) VALUES ($1, $2, $3, $4, $5)',
          [userId, false, true, 'tl', 20]
        );
      } catch (err) {
        console.warn('Could not create preferences:', err);
      }

      // Create default notifications (if table exists)
      try {
        await query(
          'INSERT INTO notifications (user_id, daily_reminders, friend_activity, weekly_report) VALUES ($1, $2, $3, $4)',
          [userId, true, true, true]
        );
      } catch (err) {
        console.warn('Could not create notifications:', err);
      }

      return NextResponse.json({ 
        success: true, 
        user: { 
            id: userId, 
            firstName, 
            lastName, 
            email, 
            role: 'USER', 
            class_name: null, 
            className: null 
        } 
      });
    }

    if (action === 'login') {
      // Support login via email
      let userRes;
      try {
        userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
      } catch (err) {
        console.error('Database query error:', err);
        return NextResponse.json({ error: 'Unable to connect to database' }, { status: 503 });
      }

      if (userRes.rows.length === 0) {
        return NextResponse.json({ error: 'User not found. Please check your email.' }, { status: 404 });
      }

      const user = userRes.rows[0];
      // Basic plain text check (should use bcrypt in production)
      if (user.password !== password) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      // Role-based portal restrictions
      if (requestedMode === 'login' && (user.role === 'ADMIN' || user.role === 'TEACHER')) {
        return NextResponse.json({ error: 'Please use the appropriate portal for staff logins.' }, { status: 403 });
      }
      
      if (requestedMode === 'admin' && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'This portal is restricted to administrators.' }, { status: 403 });
      }

      if (requestedMode === 'teacher' && user.role !== 'TEACHER') {
        return NextResponse.json({ error: 'This portal is restricted to teachers.' }, { status: 403 });
      }

      // Try to log the login activity (if table exists)
      try {
        await query(
          "INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)",
          [user.id, 'User Login', 'auth', `User logged in using email`]
        );
      } catch (err) {
        console.warn('Could not log activity:', err);
      }

      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          class_name: user.class_name || null,
          className: user.class_name || null
        } 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message
    }, { status: 500 });
  }
}
