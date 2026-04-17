import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId is required' }, { status: 400 });
    }

    // Verify teacher exists and has TEACHER role
    const teacherCheck = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [teacherId, 'TEACHER']);
    if (teacherCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Fetch all non-archived classes for this teacher
    const result = await query(
      'SELECT id, name FROM classes WHERE teacher_id = $1 AND is_archived = FALSE ORDER BY name',
      [teacherId]
    );

    const classes = result.rows.map(cls => ({
      id: cls.id,
      name: cls.name,
    }));

    return NextResponse.json({ success: true, data: { classes } });
  } catch (error: any) {
    console.error('Admin Fetch Classes Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch classes', details: error.message }, { status: 500 });
  }
}
