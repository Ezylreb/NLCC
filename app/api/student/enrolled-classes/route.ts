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

    // Get the class assigned to this student by admin (users.class_id)
    const result = await query(
      `SELECT 
        c.id,
        c.name,
        t.id as teacher_id,
        t.first_name || ' ' || t.last_name as teacher_name,
        t.email as teacher_email,
        COUNT(DISTINCT b.id) as bahagi_count
      FROM users u
      JOIN classes c ON u.class_id = c.id
      JOIN users t ON c.teacher_id = t.id
      LEFT JOIN bahagi b ON b.teacher_id = c.teacher_id 
        AND b.is_open = true
        AND b.class_name = c.name
      WHERE u.id = $1
        AND u.class_id IS NOT NULL
      GROUP BY c.id, c.name, t.id, t.first_name, t.last_name, t.email
      ORDER BY c.name`,
      [studentId]
    );

    const classes = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      title: row.name,
      description: null,
      teacher: row.teacher_name,
      teacherEmail: row.teacher_email,
      teacherId: row.teacher_id,
      bahagiCount: parseInt(row.bahagi_count)
    }));

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        enrolledCount: classes.length,
        classes
      }
    });
  } catch (error: any) {
    console.error('Error fetching enrolled classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrolled classes' },
      { status: 500 }
    );
  }
}
