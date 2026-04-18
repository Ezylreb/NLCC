import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/user/change-password
 * Change user's password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get current user's password
    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // STEP 1: Verify current password FIRST (highest priority)
    // Check if password is hashed (starts with $2a$, $2b$, $2y$) or plain text
    let isValidPassword = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
      // Password is bcrypt hashed - use bcrypt.compare
      isValidPassword = await bcrypt.compare(currentPassword, user.password);
    } else {
      // Password is plain text (legacy) - direct comparison
      isValidPassword = currentPassword === user.password;
    }
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Kasalukuyang password ay mali' },
        { status: 401 }
      );
    }

    // STEP 2: Now validate new password requirements (only after current password is verified)
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Ang bagong password ay dapat may hindi bababa sa 6 na character' },
        { status: 400 }
      );
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'Ang bagong password ay dapat may kahit isang malaking letra (A-Z)' },
        { status: 400 }
      );
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'Ang bagong password ay dapat may kahit isang special character (!@#$%^&*, etc.)' },
        { status: 400 }
      );
    }

    // STEP 3: Check if new password is same as current password
    let isSamePassword = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
      // Compare with hashed password
      isSamePassword = await bcrypt.compare(newPassword, user.password);
    } else {
      // Compare with plain text password
      isSamePassword = newPassword === user.password;
    }
    
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: 'Ang bagong password ay hindi dapat pareho sa kasalukuyang password' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    // Log activity
    try {
      await query(
        'INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)',
        [userId, 'Password Changed', 'user', 'User changed their password']
      );
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    console.log(`✅ Password changed for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Password successfully changed'
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
