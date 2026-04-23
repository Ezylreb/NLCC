import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { DAILY_LOGIN_XP } from '@/lib/constants/xp-rewards';

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
      
      // Check password - handle both plain text (legacy) and bcrypt hashed passwords
      let isValidPassword = false;
      
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
        // Password is bcrypt hashed - use bcrypt.compare
        isValidPassword = await bcrypt.compare(password, user.password);
      } else {
        // Password is plain text (legacy) - direct comparison
        isValidPassword = user.password === password;
      }
      
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      // Allow all users to login - role-based redirect happens on frontend
      // No portal restrictions - the system automatically redirects based on user's role in database

      // Award daily login XP once per calendar day.
      let dailyLoginXpEarned = 0;
      try {
        const dailyRewardResult = await query(
          `SELECT id
           FROM activity_logs
           WHERE user_id = $1
             AND type = $2
             AND created_at::date = CURRENT_DATE
           LIMIT 1`,
          [user.id, 'daily-login']
        );

        if (dailyRewardResult.rows.length === 0) {
          await query(
            `UPDATE users
             SET xp = COALESCE(xp, 0) + $1
             WHERE id = $2`,
            [DAILY_LOGIN_XP, user.id]
          );

          await query(
            'INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)',
            [user.id, 'Daily Login Reward', 'daily-login', `Awarded ${DAILY_LOGIN_XP} XP for daily login`]
          );

          dailyLoginXpEarned = DAILY_LOGIN_XP;
        }
      } catch (err) {
        console.warn('Could not award daily login XP:', err);
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
        },
        dailyLoginXpEarned,
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
