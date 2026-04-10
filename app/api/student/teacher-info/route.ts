import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/student/teacher-info?studentId=uuid
 * Get the student's assigned teacher and class information
 * Returns: { teacher_id, teacher_name, teacher_email, class_id, class_name }
 */
export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    console.log('Fetching teacher info for student:', studentId);

    // Get student's assigned teacher and class
    // Use COALESCE to handle NULL values
    const result = await query(
      `SELECT 
        s.teacher_id,
        CASE WHEN t.first_name IS NOT NULL THEN t.first_name || ' ' || COALESCE(t.last_name, '') ELSE NULL END as teacher_name,
        t.email as teacher_email,
        s.class_id,
        c.name as class_name
      FROM users s
      LEFT JOIN users t ON s.teacher_id = t.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      console.warn(`Student ${studentId} not found`);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = result.rows[0];
    console.log('Teacher info found:', !!studentData.teacher_id);

    return NextResponse.json({
      studentId,
      teacherId: studentData.teacher_id || null,
      teacherName: studentData.teacher_name || null,
      teacherEmail: studentData.teacher_email || null,
      classId: studentData.class_id || null,
      className: studentData.class_name || null,
      isAssigned: !!studentData.teacher_id
    });
  } catch (error: any) {
    console.error('Get student teacher info error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
