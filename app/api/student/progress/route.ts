import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const bahagiId = request.nextUrl.searchParams.get('bahagiId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    let progressResult;

    if (bahagiId) {
      // Get progress for specific bahagi
      progressResult = await query(
        `SELECT * FROM student_progress
         WHERE student_id = $1 AND bahagi_id = $2`,
        [studentId, bahagiId]
      );
    } else {
      // Get all progress for student
      progressResult = await query(
        `SELECT * FROM student_progress
         WHERE student_id = $1
         ORDER BY updated_at DESC`,
        [studentId]
      );
    }

    return NextResponse.json({
      progress: progressResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      studentId,
      bahagiId,
      yunitId,
      scorePercentage,
      isPassed
    } = await request.json();

    if (!studentId || !bahagiId || !yunitId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO student_progress (student_id, bahagi_id, yunit_id, score_percentage, is_passed)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, yunit_id) DO UPDATE SET
         score_percentage = $4,
         is_passed = $5,
         updated_at = NOW()
       RETURNING *`,
      [studentId, bahagiId, yunitId, scorePercentage || 0, isPassed || false]
    );

    return NextResponse.json({
      success: true,
      progress: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress', details: error.message },
      { status: 500 }
    );
  }
}
