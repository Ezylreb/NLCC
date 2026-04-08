import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get student's class info
    let classNameRes: any;
    if (classId) {
      classNameRes = await query(
        'SELECT id, name FROM classes WHERE id = $1',
        [classId]
      );
    } else {
      // Try to get class from user record
      classNameRes = await query(
        'SELECT class_name FROM users WHERE id = $1',
        [studentId]
      );
    }

    let className = '';
    if (classNameRes.rows && classNameRes.rows.length > 0) {
      className = classNameRes.rows[0].class_name || classNameRes.rows[0].name || '';
    }

    if (!className) {
      return NextResponse.json({
        lessons: [],
        message: 'Student not assigned to a class'
      });
    }

    // Get all lessons for this class
    const lessonsRes = await query(
      `SELECT 
        id, title, description, category, icon, color, 
        status, teacher_id, class_name, created_at
       FROM lessons 
       WHERE (class_name = $1 OR class_name IS NULL) 
       AND status = 'Published'
       ORDER BY created_at DESC`,
      [className]
    );

    const lessons = lessonsRes.rows || [];

    // For each lesson, get its yunits and assessments
    const lessonsWithDetails = await Promise.all(
      lessons.map(async (lesson: any) => {
        // Get yunits
        const yunitsRes = await query(
          `SELECT id, title, content, media_url, created_at
           FROM yunits
           WHERE lesson_id = $1
           ORDER BY created_at DESC`,
          [lesson.id]
        );

        // Get assessments
        const assessmentsRes = await query(
          `SELECT id, title, type, reward, created_at
           FROM assessments
           WHERE lesson_id = $1
           ORDER BY created_at DESC`,
          [lesson.id]
        );

        return {
          ...lesson,
          yunits: yunitsRes.rows || [],
          assessments: assessmentsRes.rows || []
        };
      })
    );

    return NextResponse.json({
      lessons: lessonsWithDetails
    });
  } catch (err: any) {
    console.error('Error fetching lessons:', err.message);
    return NextResponse.json(
      { error: 'Failed to fetch lessons', details: err.message },
      { status: 500 }
    );
  }
}
