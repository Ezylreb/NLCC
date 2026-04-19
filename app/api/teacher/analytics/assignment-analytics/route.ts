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

    // Get all answers with assessment details
    const { data: answers, error: answersError } = await supabase
      .from('yunit_answers')
      .select(`
        assessment_id,
        is_correct,
        points_earned,
        created_at,
        bahagi_assessment(
          id,
          title,
          points
        )
      `)
      .eq('class_id', classId)
      .gte('created_at', dateFilter.toISOString());

    if (answersError) {
      console.error('Database error:', answersError);
      return NextResponse.json({ error: answersError.message }, { status: 500 });
    }

    // Aggregate by assessment
    const assessmentMap = new Map();
    (answers || []).forEach((answer: any) => {
      const assessmentId = answer.assessment_id;
      if (!assessmentMap.has(assessmentId)) {
        assessmentMap.set(assessmentId, {
          assessmentId,
          assessmentTitle: answer.bahagi_assessment?.[0]?.title || 'Unknown',
          classAverage: 0,
          totalAttempts: 0,
          correctAttempts: 0,
          difficultyScore: 0,
          totalPoints: answer.bahagi_assessment?.[0]?.points || 0
        });
      }

      const assessment = assessmentMap.get(assessmentId);
      assessment.totalAttempts += 1;
      if (answer.is_correct) {
        assessment.correctAttempts += 1;
      }
    });

    // Calculate metrics
    const assessments = Array.from(assessmentMap.values()).map((assessment: any) => {
      const correctRate = assessment.totalAttempts > 0
        ? (assessment.correctAttempts / assessment.totalAttempts) * 100
        : 0;

      return {
        ...assessment,
        classAverage: correctRate,
        difficultyScore: 100 - correctRate // Inverse: harder questions have lower success rate
      };
    });

    return NextResponse.json({ assessments });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch assignment analytics' },
      { status: 500 }
    );
  }
}
