import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Fetch all users with the TEACHER role, ordered by name
    const result = await query(
      'SELECT id, first_name, last_name, email FROM users WHERE role = $1 ORDER BY first_name, last_name',
      ['TEACHER']
    );

    const teachers = result.rows.map(teacher => ({
      id: teacher.id,
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      email: teacher.email,
      fullName: `${teacher.first_name} ${teacher.last_name}`
    }));

    return NextResponse.json({ success: true, teachers });
  } catch (error: any) {
    console.error('Admin Fetch Teachers Error:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers', details: error.message }, { status: 500 });
  }
}
