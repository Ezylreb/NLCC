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

    // Get all students in class with their performance
    const { data: answers, error } = await supabase
      .from('yunit_answers')
      .select(`
        *,
        student_id,
        is_correct,
        points_earned,
        created_at
      `)
      .eq('class_id', classId)
      .gte('created_at', dateFilter.toISOString());

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by student
    const studentMap = new Map();
    (answers || []).forEach((answer: any) => {
      if (!studentMap.has(answer.student_id)) {
        studentMap.set(answer.student_id, {
          studentId: answer.student_id,
          studentName: answer.student_name || 'Unknown',
          averageScore: 0,
          totalSubmissions: 0,
          correctAnswers: 0,
          assessmentsCompleted: 0
        });
      }

      const student = studentMap.get(answer.student_id);
      student.totalSubmissions += 1;
      if (answer.is_correct) {
        student.correctAnswers += 1;
        student.assessmentsCompleted += 1;
      }
    });

    // Calculate averages
    const students = Array.from(studentMap.values()).map((student: any) => ({
      ...student,
      averageScore: student.totalSubmissions > 0
        ? (student.correctAnswers / student.totalSubmissions) * 100
        : 0
    }));

    return NextResponse.json({ students });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch student performance' },
      { status: 500 }
    );
  }
}
