import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const teacherId = request.nextUrl.searchParams.get('teacherId');

    console.log('[GET /api/student/bahagis] Request params:', { studentId, teacherId });

    if (!studentId || !teacherId) {
      return NextResponse.json(
        { success: false, error: 'Student ID and Teacher ID required' },
        { status: 400 }
      );
    }

    // First, get the student's class_name to filter bahagi by matching grade level
    const studentResult = await query(
      `SELECT class_name FROM users WHERE id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentClassName = studentResult.rows[0].class_name;
    console.log('[GET /api/student/bahagis] Student class_name:', studentClassName);

    // Fetch bahagi that match:
    // 1. The student's assigned teacher
    // 2. The student's class_name (grade level) - if both have class_name
    // 3. Open (not archived)
    let bahagiQuery = `
      SELECT * FROM bahagi 
      WHERE teacher_id = $1 
        AND is_open = true
    `;
    const queryParams = [teacherId];

    // If student has a class_name, filter bahagi by matching class_name
    // ONLY show bahagi that exactly match the student's grade level
    if (studentClassName) {
      bahagiQuery += ` AND class_name = $2`;
      queryParams.push(studentClassName);
    }

    bahagiQuery += ` ORDER BY id ASC`;

    console.log('[GET /api/student/bahagis] Query:', bahagiQuery);
    console.log('[GET /api/student/bahagis] Params:', queryParams);

    const bahagiResult = await query(bahagiQuery, queryParams);

    const bahagis = bahagiResult.rows;
    console.log(`[GET /api/student/bahagis] Found ${bahagis.length} bahagi for teacher ${teacherId}`);

    // For each bahagi, check if it's unlocked for the student
    const bahagiWithStatus = await Promise.all(
      bahagis.map(async (bahagi: any) => {
        // Get all lessons (yunits) for this bahagi
        const yunitResult = await query(
          `SELECT id FROM lesson WHERE bahagi_id = $1`,
          [bahagi.id]
        );

        const totalYunits = yunitResult.rows.length;

        // Check if all lessons are passed (if student_progress table exists)
        let passedYunits = 0;
        try {
          const passedResult = await query(
            `SELECT COUNT(*) as passed_count FROM lesson_progress
             WHERE student_id = $1 AND lesson_id IN (SELECT id FROM lesson WHERE bahagi_id = $2) AND completed = true`,
            [studentId, bahagi.id]
          );
          passedYunits = parseInt(passedResult.rows[0]?.passed_count || 0);
        } catch (err) {
          // lesson_progress table doesn't exist or query failed, default to 0
          console.log('[GET /api/student/bahagis] lesson_progress query failed, using default values');
        }

        const allPassed = totalYunits > 0 && passedYunits === totalYunits;

        // For now, all bahagi are unlocked (simpler logic)
        const isUnlocked = true;

        return {
          id: bahagi.id,
          title: bahagi.title,
          description: bahagi.description,
          image_url: bahagi.icon_path || bahagi.image_url,
          icon_path: bahagi.icon_path,
          icon_type: bahagi.icon_type,
          yunitCount: totalYunits,
          passedYunits: passedYunits,
          isUnlocked: isUnlocked,
          allPassed: allPassed
        };
      })
    );

    console.log(`[GET /api/student/bahagis] Returning ${bahagiWithStatus.length} bahagi with status`);

    return NextResponse.json({
      success: true,
      data: { 
        bahagis: bahagiWithStatus,
        studentClassName
      }
    });
  } catch (error: any) {
    console.error('[GET /api/student/bahagis] Error:', error);
    console.error('[GET /api/student/bahagis] Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bahagis', details: error.message },
      { status: 500 }
    );
  }
}
