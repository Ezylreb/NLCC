import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, answers, type, studentId } = body;

    if (!assessmentId || !studentId) {
      return NextResponse.json(
        { error: 'Assessment ID and student ID are required' },
        { status: 400 }
      );
    }

    // Store assessment response
    const { data, error } = await supabase
      .from('assessment_responses')
      .insert({
        assessment_id: assessmentId,
        student_id: studentId,
        answers: answers || {},
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit assessment' },
        { status: 500 }
      );
    }

    // TODO: Calculate score based on assessment type and correct answers

    return NextResponse.json({
      response: {
        id: data.id,
        assessmentId: data.assessment_id,
        studentId: data.student_id,
        submittedAt: data.submitted_at,
        message: '✅ Assessment submitted successfully!'
      }
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
