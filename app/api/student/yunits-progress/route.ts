import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bahagiId = searchParams.get('bahagiId');
    const studentId = searchParams.get('studentId');

    if (!bahagiId) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    console.log('[GET /api/student/yunits-progress] Fetching for bahagiId:', bahagiId, 'studentId:', studentId);

    // First, get the assessment count for this bahagi (one query)
    const assessmentCountResult = await query(
      `SELECT COUNT(*) as count FROM bahagi_assessment WHERE bahagi_id = $1`,
      [bahagiId]
    );
    const assessmentCount = parseInt(assessmentCountResult.rows[0]?.count || 0);

    // Get all lessons for this bahagi with student progress (optimized - no subquery)
    const result = await query(
      `SELECT 
        l.id,
        l.title,
        l.subtitle,
        l.discussion,
        l.media_url,
        l.audio_url,
        l.lesson_order,
        l.created_at,
        COALESCE(lp.completed, false) as completed,
        COALESCE(lp.xp_earned, 0) as xp_earned,
        COALESCE(lp.coins_earned, 0) as coins_earned,
        lp.completion_date
       FROM lesson l
       LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.student_id = $2
       WHERE l.bahagi_id = $1
       ORDER BY l.lesson_order ASC, l.created_at ASC`,
      [bahagiId, studentId || null]
    );

    console.log('[GET /api/student/yunits-progress] Found', result.rows.length, 'lessons');

    // Add isLocked status based on strict sequential progression
    const yunits = result.rows.map((lesson, index) => {
      let isLocked = false;
      
      // First lesson is always unlocked
      if (index === 0) {
        isLocked = false;
      }
      // All other lessons require the previous lesson to be completed
      else {
        const previousLesson = result.rows[index - 1];
        isLocked = !previousLesson.completed;
      }

      return {
        id: lesson.id,
        title: lesson.title,
        subtitle: lesson.subtitle,
        discussion: lesson.discussion,
        media_url: lesson.media_url,
        audio_url: lesson.audio_url,
        lesson_order: lesson.lesson_order,
        completed: lesson.completed,
        xp_earned: parseInt(lesson.xp_earned),
        coins_earned: parseInt(lesson.coins_earned),
        completion_date: lesson.completion_date,
        assessment_count: assessmentCount,
        isLocked
      };
    });

    console.log('[GET /api/student/yunits-progress] Returning', yunits.length, 'yunits with lock status');

    return NextResponse.json({
      success: true,
      data: yunits
    });
  } catch (error) {
    console.error('[GET /api/student/yunits-progress] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch yunits with progress' },
      { status: 500 }
    );
  }
}
