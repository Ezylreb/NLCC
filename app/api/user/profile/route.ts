import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * PATCH /api/user/profile
 * Update current user's profile (firstName, lastName, email)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, firstName, lastName, email } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Check if email is being updated and if it's already taken by another user
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another account' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updateQuery = `
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, first_name, last_name, email, role
    `;

    const result = await query(updateQuery, [firstName, lastName, email, userId]);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found or update failed' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    // Log activity
    try {
      await query(
        'INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)',
        [userId, 'Profile Updated', 'user', `Updated profile: ${firstName} ${lastName}`]
      );
    } catch (err) {
      console.warn('Could not log activity:', err);
      // Don't fail the update if logging fails
    }

    console.log(`✅ Profile updated for user ${userId}: ${firstName} ${lastName}`);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
