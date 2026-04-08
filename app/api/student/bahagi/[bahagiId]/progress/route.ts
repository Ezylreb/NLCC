import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bahagiId: string }> }
) {
  try {
    const { bahagiId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!bahagiId || !studentId) {
      return NextResponse.json(
        { error: 'Bahagi ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Get bahagi info
    const bahagiResult = await query(
      'SELECT id, title FROM bahagi WHERE id = $1',
      [bahagiId]
    );

    if (bahagiResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    // Get lesson count and completion stats
    const lessonsResult = await query(
      `SELECT 
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN lp.completed = true THEN 1 END) as completed_lessons,
        COALESCE(SUM(lp.xp_earned), 0) as total_xp,
        COALESCE(SUM(lp.coins_earned), 0) as total_coins
       FROM lesson l
       LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.student_id = $1
       WHERE l.bahagi_id = $2`,
      [studentId, bahagiId]
    );

    // Get assessment stats
    const assessmentsResult = await query(
      `SELECT 
        COUNT(ba.id) as total_assessments,
        COUNT(CASE WHEN ar.is_correct = true THEN 1 END) as correct_assessments
       FROM bahagi_assessment ba
       LEFT JOIN assessment_response ar ON ba.id = ar.assessment_id AND ar.student_id = $1
       WHERE ba.bahagi_id = $2`,
      [studentId, bahagiId]
    );

    // Calculate completion percentage
    const lessonsStats = lessonsResult.rows[0];
    const completionPercentage = lessonsStats.total_lessons > 0 
      ? Math.round((lessonsStats.completed_lessons / lessonsStats.total_lessons) * 100)
      : 0;

    return NextResponse.json({
      bahagi: bahagiResult.rows[0],
      progress: {
        lessons: {
          total: parseInt(lessonsStats.total_lessons),
          completed: parseInt(lessonsStats.completed_lessons),
          completionPercentage
        },
        assessments: {
          total: parseInt(assessmentsResult.rows[0].total_assessments),
          correct: parseInt(assessmentsResult.rows[0].correct_assessments)
        },
        rewards: {
          totalXp: parseInt(lessonsStats.total_xp),
          totalCoins: parseInt(lessonsStats.total_coins)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bahagi progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bahagi progress' },
      { status: 500 }
    );
  }
}
