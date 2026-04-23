import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnonClient, missingSupabaseConfigResponse } from '@/lib/supabase-route';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAnonClient();
    if (!supabase) {
      return missingSupabaseConfigResponse();
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const timeRange = searchParams.get('timeRange') || 'month';

    if (!classId) {
      return NextResponse.json(
        { error: 'Missing classId' },
        { status: 400 }
      );
    }

    let dateFilter = new Date();
    if (timeRange === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeRange === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    // Get all answers
    const { data: answers, error: answersError } = await supabase
      .from('yunit_answers')
      .select('is_correct, points_earned, assessment_id, created_at')
      .eq('class_id', classId)
      .gte('created_at', dateFilter.toISOString());

    if (answersError) {
      console.error('Database error:', answersError);
      return NextResponse.json({ error: answersError.message }, { status: 500 });
    }

    const answerList = answers || [];

    // Calculate class average
    const classAverage = answerList.length > 0
      ? (answerList.filter(a => a.is_correct).length / answerList.length) * 100
      : 0;

    // Count unique assessments
    const uniqueAssessments = new Set(answerList.map(a => a.assessment_id));
    const totalAssignments = uniqueAssessments.size;

    // Calculate completion rate (how many students started assignments)
    const completionRate = totalAssignments > 0
      ? (answerList.length / totalAssignments) / 10 * 100 // Normalize
      : 0;

    return NextResponse.json({
      stats: {
        classAverage: Math.min(100, Math.max(0, classAverage)),
        totalAssignments,
        completionRate: Math.min(100, Math.max(0, completionRate)),
        totalAnswers: answerList.length,
        correctAnswers: answerList.filter(a => a.is_correct).length
      }
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch class stats' },
      { status: 500 }
    );
  }
}
