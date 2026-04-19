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
      .select(`
        *,
        assessment_id,
        is_correct,
        points_earned,
        attempt_number,
        submitted_at,
        assessment_type,
        bahagi_assessment(
          id,
          title,
          points,
          type,
          bahagi(
            id,
            title
          ),
          lesson(
            id,
            title
          )
        )
      `)
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const grades = (answers || []).map((answer: any) => ({
      assessmentId: answer.assessment_id,
      assessmentTitle: answer.bahagi_assessment?.[0]?.title || 'Unknown',
      bahagiTitle: answer.bahagi_assessment?.[0]?.bahagi?.[0]?.title || 'Unknown',
      yunitTitle: answer.bahagi_assessment?.[0]?.lesson?.[0]?.title || 'Unknown',
      type: answer.assessment_type,
      pointsEarned: answer.points_earned || 0,
      totalPoints: answer.bahagi_assessment?.[0]?.points || 0,
      percentage: answer.bahagi_assessment?.[0]?.points 
        ? (answer.points_earned / answer.bahagi_assessment[0].points) * 100 
        : 0,
      attemptNumber: answer.attempt_number,
      submittedAt: answer.submitted_at,
      isCorrect: answer.is_correct
    }));

    return NextResponse.json({ grades });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch student grades' },
      { status: 500 }
    );
  }
}
