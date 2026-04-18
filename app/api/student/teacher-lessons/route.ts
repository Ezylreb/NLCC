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
        { success: false, error: 'Student ID and Teacher ID required' },
        { status: 400 }
      );
    }

    console.log('[GET /api/student/teacher-lessons] Fetching for:', { studentId, teacherId });

    // Get student's class_name to filter bahagi by grade level
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
    console.log('[GET /api/student/teacher-lessons] Student class_name:', studentClassName);

    // Fetch all bahagis (parts/lessons) from the teacher
    // Filter by student's grade level (class_name) if available
    // Only show published and non-archived bahagi
    let bahagiQuery = `
      SELECT 
        b.id,
        b.title,
        b.description,
        b.icon_path as image_url,
        b.icon_type,
        b.teacher_id,
        b.class_name,
        COUNT(DISTINCT l.id) as yunit_count
      FROM bahagi b
      LEFT JOIN lesson l ON b.id = l.bahagi_id
      WHERE b.teacher_id = $1 
        AND b.is_open = true
    `;
    
    const queryParams = [teacherId];

    // If student has a class_name, filter bahagi by matching class_name (grade level)
    // ONLY show bahagi that exactly match the student's grade level
    if (studentClassName) {
      bahagiQuery += ` AND b.class_name = $2`;
      queryParams.push(studentClassName);
    }

    bahagiQuery += `
      GROUP BY b.id, b.title, b.description, b.icon_path, b.icon_type, b.teacher_id, b.class_name
      ORDER BY b.id ASC
    `;

    console.log('[GET /api/student/teacher-lessons] Query:', bahagiQuery);
    console.log('[GET /api/student/teacher-lessons] Params:', queryParams);

    const bahagiResult = await query(bahagiQuery, queryParams);

    const bahagis = bahagiResult.rows;
    console.log(`[GET /api/student/teacher-lessons] Found ${bahagis.length} bahagi for teacher ${teacherId}`);
    console.log('[GET /api/student/teacher-lessons] Bahagi details:', bahagis.map((b: any) => ({ id: b.id, title: b.title, class_name: b.class_name, description: b.description?.substring(0, 30) })));

    // For each bahagi, get yunits and their details
    const lessonsWithYunits = await Promise.all(
      bahagis.map(async (bahagi: any, bahagiIndex: number) => {
        try {
          // Get lessons (yunits) for this bahagi
          let yunitResult;
          try {
            yunitResult = await query(
              `SELECT 
                id,
                title,
                subtitle as description,
                bahagi_id
              FROM lesson
              WHERE bahagi_id = $1
              ORDER BY lesson_order ASC, id ASC`,
              [bahagi.id]
            );
          } catch (err) {
            console.warn(`Could not fetch lessons for bahagi ${bahagi.id}:`, err);
            yunitResult = { rows: [] };
          }

          // Get student's progress for this bahagi
          let passedYunits = 0;
          try {
            const progressResult = await query(
              `SELECT COUNT(*) as passed_count FROM lesson_progress
               WHERE student_id = $1 AND lesson_id IN (SELECT id FROM lesson WHERE bahagi_id = $2) AND completed = true`,
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

        const lessonData = {
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
        
        console.log(`[GET /api/student/teacher-lessons] Lesson ${bahagiIndex + 1} mapped:`, { id: lessonData.id, title: lessonData.title, originalTitle: bahagi.title });
        
        return lessonData;
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
      success: true,
      data: {
        studentId,
        teacherId,
        totalLessons: lessonsWithYunits.length,
        completedLessons: lessonsWithYunits.filter((l: any) => l.isCompleted).length,
        lessons: lessonsWithYunits
      }
    });
  } catch (error: any) {
    console.error('Get teacher lessons error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
