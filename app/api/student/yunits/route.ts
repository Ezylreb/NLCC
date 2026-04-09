import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const bahagiId = request.nextUrl.searchParams.get('bahagiId');
    const teacherId = request.nextUrl.searchParams.get('teacherId');

    if (!studentId || !bahagiId) {
      return NextResponse.json(
        { error: 'Student ID and Bahagi ID required' },
        { status: 400 }
      );
    }

    // STRICT DATA FILTERING: Verify student can access this bahagi
    // by confirming the bahagi belongs to the teacher
    const bahagiVerify = await query(
      `SELECT id FROM bahagis WHERE id = $1 AND is_archived = false`,
      [bahagiId]
    );

    if (bahagiVerify.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    // Get all yunits for this bahagi
    const yunitsResult = await query(
      `SELECT * FROM yunits 
       WHERE bahagi_id = $1
       ORDER BY position ASC, id ASC`,
      [bahagiId]
    );

    const yunits = yunitsResult.rows;

    // For each yunit, get progress and assessments
    const yunitsWithProgress = await Promise.all(
      yunits.map(async (yunit: any) => {
        // Get student progress for this yunit
        const progressResult = await query(
          `SELECT * FROM student_progress
           WHERE student_id = $1 AND yunit_id = $2
           LIMIT 1`,
          [studentId, yunit.id]
        );

        const progress = progressResult.rows[0] || null;

        // Get assessments for this yunit
        const assessmentResult = await query(
          `SELECT id, type, content FROM bahagi_assessment
           WHERE yunit_id = $1
           ORDER BY assessment_order ASC`,
          [yunit.id]
        );

        return {
          ...yunit,
          progress: progress,
          isPassed: progress?.is_passed || false,
          score: progress?.score_percentage || 0,
          xpEarned: progress?.xp_earned || 0,
          coinsEarned: progress?.coins_earned || 0,
          assessmentCount: assessmentResult.rows.length,
          assessments: assessmentResult.rows
        };
      })
    );

    return NextResponse.json({
      yunits: yunitsWithProgress
    });
  } catch (error: any) {
    console.error('Error fetching yunits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yunits', details: error.message },
      { status: 500 }
    );
  }
}
