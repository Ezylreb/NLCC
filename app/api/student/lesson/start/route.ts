import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/student/lesson/start
 * Track when a student starts viewing a lesson
 * Creates a progress record so unlock logic knows the student has accessed this lesson
 */
export async function POST(request: NextRequest) {
  try {
    const { studentId, lessonId } = await request.json();

    if (!studentId || !lessonId) {
      return NextResponse.json(
        { error: 'Student ID and Lesson ID are required' },
        { status: 400 }
      );
    }

    // Check if progress record already exists
    const existingProgress = await query(
      `SELECT id FROM lesson_progress 
       WHERE student_id = $1 AND lesson_id = $2`,
      [studentId, lessonId]
    );

    if (existingProgress.rows.length === 0) {
      // Create new progress record (not completed, just started)
      await query(
        `INSERT INTO lesson_progress (student_id, lesson_id, completed, completion_date, xp_earned, coins_earned)
         VALUES ($1, $2, false, NULL, 0, 0)
         ON CONFLICT (student_id, lesson_id) DO NOTHING`,
        [studentId, lessonId]
      );

      console.log(`[Lesson Start] Created progress record for student ${studentId}, lesson ${lessonId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson start tracked'
    });
  } catch (error: any) {
    console.error('[Lesson Start] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track lesson start', details: error.message },
      { status: 500 }
    );
  }
}
