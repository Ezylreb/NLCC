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

    // Find the furthest lesson that has been accessed (completed or has progress)
    let furthestAccessedIndex = -1;
    result.rows.forEach((lesson, index) => {
      // If lesson is completed or has any progress (xp/coins earned), count it as accessed
      if (lesson.completed || lesson.xp_earned > 0 || lesson.coins_earned > 0) {
        furthestAccessedIndex = Math.max(furthestAccessedIndex, index);
      }
    });

    // Add isLocked status based on progression
    const yunits = result.rows.map((lesson, index) => {
      let isLocked = false;
      
      // First lesson is always unlocked
      if (index === 0) {
        isLocked = false;
      }
      // Second lesson is also unlocked by default (allows sequential viewing)
      else if (index === 1) {
        isLocked = false;
      }
      // Unlock all lessons up to 2 positions beyond the furthest accessed
      // This allows continuous navigation through lessons
      else if (furthestAccessedIndex >= 0 && index <= furthestAccessedIndex + 2) {
        isLocked = false;
      }
      // Otherwise, check if previous lesson is completed
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
