import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/student/teacher-lessons?studentId=uuid&teacherId=uuid
 * Get all lessons (bahagis) posted by the student's assigned teacher
 * Returns: Array of lessons with full details (Bahagi, Yunit, title, image, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const teacherId = request.nextUrl.searchParams.get('teacherId');

    if (!studentId || !teacherId) {
      return NextResponse.json(
        { error: 'Student ID and Teacher ID required' },
        { status: 400 }
      );
    }

    console.log('Fetching lessons for teacher:', teacherId);

    // Fetch all bahagis (parts/lessons) from the teacher
    // Try to fetch with minimal required columns first
    let bahagiResult;
    try {
      bahagiResult = await query(
        `SELECT 
          b.id,
          b.title,
          b.description,
          b.image_url,
          COALESCE(b.display_order, 1) as display_order,
          b.teacher_id,
          COUNT(DISTINCT y.id) as yunit_count
        FROM bahagis b
        LEFT JOIN yunits y ON b.id = y.bahagi_id
        WHERE b.teacher_id = $1 
        GROUP BY b.id, b.title, b.description, b.image_url, b.display_order, b.teacher_id
        ORDER BY COALESCE(b.display_order, 1) ASC, b.id ASC`,
        [teacherId]
      );
    } catch (err: any) {
      console.error('Error fetching bahagis:', err.message);
      // Fallback: try without display_order
      bahagiResult = await query(
        `SELECT 
          b.id,
          b.title,
          b.description,
          b.image_url,
          b.teacher_id
        FROM bahagis b
        WHERE b.teacher_id = $1
        ORDER BY b.id ASC`,
        [teacherId]
      );
    }

    const bahagis = bahagiResult.rows;
    console.log(`Found ${bahagis.length} bahagis for teacher ${teacherId}`);

    // For each bahagi, get yunits and their details
    const lessonsWithYunits = await Promise.all(
      bahagis.map(async (bahagi: any, bahagiIndex: number) => {
        try {
          // Get yunits for this bahagi
          let yunitResult;
          try {
            yunitResult = await query(
              `SELECT 
                id,
                title,
                description,
                display_order,
                image_url,
                bahagi_id
              FROM yunits
              WHERE bahagi_id = $1
              ORDER BY COALESCE(display_order, 1) ASC`,
              [bahagi.id]
            );
          } catch (err) {
            console.warn(`Could not fetch yunits for bahagi ${bahagi.id}:`, err);
            yunitResult = { rows: [] };
          }

          // Get student's progress for this bahagi
          let passedYunits = 0;
          try {
            const progressResult = await query(
              `SELECT COUNT(*) as passed_count FROM student_progress
               WHERE student_id = $1 AND bahagi_id = $2 AND is_passed = true`,
              [studentId, bahagi.id]
            );
            passedYunits = parseInt(progressResult.rows[0]?.passed_count || 0);
          } catch (err) {
            console.warn(`Could not fetch progress for bahagi ${bahagi.id}:`, err);
          }

          const totalYunits = yunitResult.rows.length;
          const allPassed = totalYunits > 0 && passedYunits === totalYunits;

          // Simple unlock logic: first lesson always unlocked, others are unlocked
          const isUnlocked = bahagiIndex === 0 || allPassed; // Simplified for now

        return {
          id: bahagi.id,
          bahagiNumber: bahagiIndex + 1,
          title: bahagi.title || `Lesson ${bahagiIndex + 1}`,
          description: bahagi.description || '',
          imageUrl: bahagi.image_url || '',
          yunitCount: yunitResult?.rows?.length || 0,
          yunits: yunitResult?.rows || [],
          passedYunits,
          totalYunits,
          isCompleted: allPassed,
          isUnlocked,
          xpReward: 10,
          difficulty: totalYunits <= 2 ? 'beginner' : totalYunits <= 4 ? 'intermediate' : 'advanced'
        };
        } catch (lessonErr: any) {
          console.error(`Error processing bahagi ${bahagi.id}:`, lessonErr);
          return {
            id: bahagi.id,
            bahagiNumber: bahagiIndex + 1,
            title: bahagi.title || `Lesson ${bahagiIndex + 1}`,
            description: bahagi.description || '',
            imageUrl: bahagi.image_url || '',
            yunitCount: 0,
            yunits: [],
            passedYunits: 0,
            totalYunits: 0,
            isCompleted: false,
            isUnlocked: bahagiIndex === 0,
            xpReward: 10,
            difficulty: 'beginner'
          };
        }
      })
    );

    console.log(`Returning ${lessonsWithYunits.length} lessons`);
    return NextResponse.json({
      studentId,
      teacherId,
      totalLessons: lessonsWithYunits.length,
      completedLessons: lessonsWithYunits.filter((l: any) => l.isCompleted).length,
      lessons: lessonsWithYunits
    });
  } catch (error: any) {
    console.error('Get teacher lessons error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
