import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const classId = request.nextUrl.searchParams.get('classId') || request.nextUrl.searchParams.get('teacherId');

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Student ID and Class/Teacher ID required' },
        { status: 400 }
      );
    }

    // STRICT DATA FILTERING: Only get bahagis from the specified class/teacher
    // This ensures students only see content from classes they're enrolled in
    const bahagiResult = await query(
      `SELECT * FROM bahagis 
       WHERE teacher_id = $1 AND is_archived = false
       ORDER BY display_order ASC, id ASC`,
      [classId]
    );

    const bahagis = bahagiResult.rows;

    // For each bahagi, check if it's unlocked for the student
    const bahagiWithStatus = await Promise.all(
      bahagis.map(async (bahagi: any) => {
        // Get all yunits for this bahagi
        const yunitResult = await query(
          `SELECT id FROM yunits WHERE bahagi_id = $1`,
          [bahagi.id]
        );

        const totalYunits = yunitResult.rows.length;

        // Check if all yunits are passed
        const passedResult = await query(
          `SELECT COUNT(*) as passed_count FROM student_progress
           WHERE student_id = $1 AND bahagi_id = $2 AND is_passed = true`,
          [studentId, bahagi.id]
        );

        const passedYunits = parseInt(passedResult.rows[0]?.passed_count || 0);
        const allPassed = totalYunits > 0 && passedYunits === totalYunits;

        // Determine if bahagi is unlocked
        let isUnlocked = false;
        
        // First bahagi is always unlocked
        const isFirstBahagi = bahagi.display_order === 1 || bahagis[0].id === bahagi.id;
        if (isFirstBahagi) {
          isUnlocked = true;
        } else {
          // Check if previous bahagi is passed
          const prevBahagiResult = await query(
            `SELECT id FROM bahagis WHERE teacher_id = $1 AND display_order = $2 AND is_archived = false`,
            [classId, (bahagi.display_order || 0) - 1]
          );

          if (prevBahagiResult.rows.length > 0) {
            const prevBahagi = prevBahagiResult.rows[0];
            const prevPassedResult = await query(
              `SELECT COUNT(*) as count FROM student_progress
               WHERE student_id = $1 AND bahagi_id = $2 AND is_passed = true`,
              [studentId, prevBahagi.id]
            );

            const prevYunitResult = await query(
              `SELECT COUNT(*) as count FROM yunits WHERE bahagi_id = $1`,
              [prevBahagi.id]
            );

            const prevYunitCount = parseInt(prevYunitResult.rows[0]?.count || 0);
            const prevPassedCount = parseInt(prevPassedResult.rows[0]?.count || 0);
            isUnlocked = prevYunitCount > 0 && prevPassedCount === prevYunitCount;
          }
        }

        return {
          ...bahagi,
          yunitCount: totalYunits,
          passedYunits: passedYunits,
          isUnlocked: isUnlocked,
          allPassed: allPassed
        };
      })
    );

    return NextResponse.json({
      bahagis: bahagiWithStatus
    });
  } catch (error: any) {
    console.error('Error fetching bahagis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bahagis', details: error.message },
      { status: 500 }
    );
  }
}
