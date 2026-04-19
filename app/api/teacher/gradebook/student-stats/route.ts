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
    const studentId = searchParams.get('studentId');

    if (!classId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get all grades for student
    const { data: answers, error } = await supabase
      .from('yunit_answers')
      .select('is_correct, points_earned, created_at, bahagi_assessment(points)')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const answerList = answers || [];

    if (answerList.length === 0) {
      return NextResponse.json({
        stats: {
          overallGPA: 0,
          totalPoints: 0,
          maxPoints: 0,
          completionRate: 0,
          bestScore: 0,
          worstScore: 0,
          improvementTrend: 'stable',
          assessmentsTaken: 0
        }
      });
    }

    // Calculate metrics
    const totalPoints = answerList.reduce((sum, a) => sum + (a.points_earned || 0), 0);
    const maxPoints = answerList.reduce((sum, a) => sum + (a.bahagi_assessment?.[0]?.points || 0), 0);
    const overallGPA = maxPoints > 0 ? (totalPoints / maxPoints) * 4.0 : 0;

    // Calculate best and worst scores
    const percentages = answerList.map(a => 
      a.bahagi_assessment?.[0]?.points 
        ? (a.points_earned / a.bahagi_assessment[0].points) * 100 
        : 0
    );

    const bestScore = Math.max(...percentages, 0);
    const worstScore = Math.min(...percentages, 100);

    // Analyze improvement trend (first third vs last third)
    const thirdLength = Math.ceil(answerList.length / 3);
    const firstThird = percentages.slice(0, thirdLength);
    const lastThird = percentages.slice(-thirdLength);

    const firstAvg = firstThird.length > 0 
      ? firstThird.reduce((a, b) => a + b) / firstThird.length 
      : 0;
    const lastAvg = lastThird.length > 0 
      ? lastThird.reduce((a, b) => a + b) / lastThird.length 
      : 0;

    let improvementTrend: 'up' | 'down' | 'stable' = 'stable';
    if (lastAvg > firstAvg + 5) {
      improvementTrend = 'up';
    } else if (lastAvg < firstAvg - 5) {
      improvementTrend = 'down';
    }

    // Calculate completion rate
    const completionRate = (answerList.filter(a => a.is_correct).length / answerList.length) * 100;

    return NextResponse.json({
      stats: {
        overallGPA: Math.min(4.0, overallGPA),
        totalPoints,
        maxPoints,
        completionRate,
        bestScore,
        worstScore,
        improvementTrend,
        assessmentsTaken: answerList.length
      }
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch student stats' },
      { status: 500 }
    );
  }
}
