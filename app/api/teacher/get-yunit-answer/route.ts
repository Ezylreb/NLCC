import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnonClient, missingSupabaseConfigResponse } from '@/lib/supabase-route';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAnonClient();
    if (!supabase) {
      return missingSupabaseConfigResponse();
    }

    const { searchParams } = new URL(req.url);
    const yunitId = searchParams.get('yunitId');
    const assessmentId = searchParams.get('assessmentId');
    const studentId = searchParams.get('studentId');

    if (!yunitId || !assessmentId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch all attempts for this student-assessment combination
    const { data, error } = await supabase
      .from('yunit_answers')
      .select('*')
      .eq('yunit_id', yunitId)
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attempts: data || [],
      totalAttempts: data?.length || 0,
      hasAnswered: (data || []).length > 0,
      lastAttempt: data?.[0] || null
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}
