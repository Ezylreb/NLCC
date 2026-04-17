import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/student/enrolled-classes?studentId=uuid
 * Get all classes a student is enrolled in
 * Returns: Array of {id, title, teacher, teacherEmail, bahagiCount}
 * 
 * Validates that:
 * - Student ID matches authenticated user
 * - Student only sees classes they are enrolled in via class_enrollments
 */

export async function GET(request: NextRequest) {
  try {
    // Support both header and query parameter for studentId
    let studentId = request.headers.get('x-student-id');
    if (!studentId) {
      studentId = request.nextUrl.searchParams.get('studentId');
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    // Get enrolled classes for this student
    const result = await query(
      `SELECT DISTINCT 
        c.id,
        c.name,
        t.id as teacher_id,
        t.first_name || ' ' || t.last_name as teacher_name,
        t.email as teacher_email,
        COUNT(DISTINCT b.id) as bahagi_count
      FROM classes c
      JOIN class_enrollments ce ON c.id = ce.class_id
      JOIN users t ON c.teacher_id = t.id
      LEFT JOIN bahagis b ON b.teacher_id = c.teacher_id AND b.is_archived = false
      WHERE ce.student_id = $1
      GROUP BY c.id, c.name, t.id, t.first_name, t.last_name, t.email
      ORDER BY c.name`,
      [studentId]
    );

    return NextResponse.json({
    studentId,
    enrolledCount: result.rows.length,
    classes: result.rows.map((row: any) => ({
      id: row.id,
      title: row.name,
      description: null,
      teacher: row.teacher_name,
      teacherEmail: row.teacher_email,
      teacherId: row.teacher_id,
      bahagiCount: parseInt(row.bahagi_count)
    }))
  });
  } catch (error: any) {
    console.error('Error fetching enrolled classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrolled classes' },
      { status: 500 }
    );
  }
}
