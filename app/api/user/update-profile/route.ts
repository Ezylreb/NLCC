import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, firstName, lastName, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID ay kinakailangan' }, { status: 400 });
    }

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Pangalan ay kinakailangan' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email ay kinakailangan' }, { status: 400 });
    }

    // Check if email is already used by another user
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Email ay ginagamit na ng ibang user' }, { status: 400 });
    }

    // Update user profile
    const result = await query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4 RETURNING *',
      [firstName, lastName, email, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User hindi nahanap' }, { status: 404 });
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({ 
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        lrn: updatedUser.lrn
      }
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Hindi ma-update ang profile',
      details: error.message 
    }, { status: 500 });
  }
}
