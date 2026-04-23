import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnonClient, missingSupabaseConfigResponse } from '@/lib/supabase-route';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAnonClient();
    if (!supabase) {
      return missingSupabaseConfigResponse();
    }

    const {
      yunitId,
      assessmentId,
      studentId,
      studentAnswer,
      isCorrect,
      pointsEarned,
      assessmentType,
      attemptNumber
    } = await req.json();

    if (!yunitId || !assessmentId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store the answer submission
    const { data, error } = await supabase
      .from('yunit_answers')
      .insert({
        yunit_id: yunitId,
        assessment_id: assessmentId,
        student_id: studentId,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        assessment_type: assessmentType,
        attempt_number: attemptNumber,
        submitted_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer: data?.[0],
      message: isCorrect ? 'Correct answer!' : 'Answer submitted for review'
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}
