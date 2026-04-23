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

    const columnCheck = await query(
      `SELECT
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'bahagi' AND column_name = 'is_published'
         ) AS has_is_published,
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'bahagi' AND column_name = 'is_archived'
         ) AS has_is_archived`
    );

    const hasIsPublished = Boolean(columnCheck.rows?.[0]?.has_is_published);
    const hasIsArchived = Boolean(columnCheck.rows?.[0]?.has_is_archived);
    const publishedColumn = hasIsPublished ? 'b.is_published' : 'b.is_open';
    const archivedFilter = hasIsArchived ? 'AND COALESCE(b.is_archived, false) = false' : '';

    // Fetch all bahagis (parts/lessons) from the teacher.
    // Students must only see published, non-archived bahagis.
    let bahagiQuery = `
      SELECT 
        b.id,
        b.title,
        b.description,
        b.icon_path as image_url,
        b.icon_type,
        b.teacher_id,
        b.class_name,
        b.quarter,
        b.week_number,
        b.module_number,
        COUNT(DISTINCT l.id) as yunit_count
      FROM bahagi b
      LEFT JOIN lesson l ON b.id = l.bahagi_id
      WHERE b.teacher_id = $1 
        ${archivedFilter}
        AND COALESCE(${publishedColumn}, false) = true
    `;
    
    const queryParams = [teacherId];

    // If student has a class_name, filter bahagi by matching class_name (grade level)
    // ONLY show bahagi that exactly match the student's grade level
    if (studentClassName) {
      bahagiQuery += ` AND b.class_name = $2`;
      queryParams.push(studentClassName);
    }

    bahagiQuery += `
      GROUP BY b.id, b.title, b.description, b.icon_path, b.icon_type, b.teacher_id, b.class_name, b.quarter, b.week_number, b.module_number
      ORDER BY b.id ASC
    `;

    console.log('[GET /api/student/teacher-lessons] Query:', bahagiQuery);
    console.log('[GET /api/student/teacher-lessons] Params:', queryParams);

    const bahagiResult = await query(bahagiQuery, queryParams);

    const bahagis = bahagiResult.rows;
    console.log(`[GET /api/student/teacher-lessons] Found ${bahagis.length} bahagi for teacher ${teacherId}`);
    console.log('[GET /api/student/teacher-lessons] Bahagi details:', bahagis.map((b: any) => ({ 
      id: b.id, 
      title: b.title, 
      class_name: b.class_name, 
      quarter: b.quarter,
      week_number: b.week_number,
      module_number: b.module_number,
      description: b.description?.substring(0, 30) 
    })));

    // Determine which bahagis the student has COMPLETED (all yunits done)
    const bahagiCompletionMap = new Map<string, boolean>();
    for (let i = 0; i < bahagis.length; i++) {
      try {
        // Get total yunits in this bahagi
        const totalYunitsResult = await query(
          `SELECT COUNT(*) as total FROM lesson WHERE bahagi_id = $1`,
          [bahagis[i].id]
        );
        const totalYunits = parseInt(totalYunitsResult.rows[0]?.total || 0);
        
        // Get completed yunits for this bahagi
        const completedYunitsResult = await query(
          `SELECT COUNT(*) as completed 
           FROM lesson_progress
           WHERE student_id = $1 
           AND lesson_id IN (SELECT id FROM lesson WHERE bahagi_id = $2)
           AND completed = true`,
          [studentId, bahagis[i].id]
        );
        const completedYunits = parseInt(completedYunitsResult.rows[0]?.completed || 0);
        
        // Bahagi is complete if all yunits are completed
        const isComplete = totalYunits > 0 && completedYunits === totalYunits;
        bahagiCompletionMap.set(bahagis[i].id, isComplete);
        
        console.log(`[Bahagi ${i}] ${bahagis[i].title}: ${completedYunits}/${totalYunits} yunits complete (${isComplete ? 'COMPLETE' : 'INCOMPLETE'})`);
      } catch (err) {
        console.warn(`Could not check completion for bahagi ${bahagis[i].id}:`, err);
        bahagiCompletionMap.set(bahagis[i].id, false);
      }
    }

    // Find the highest bahagi index that is COMPLETE
    let highestCompletedIndex = -1;
    for (let i = 0; i < bahagis.length; i++) {
      if (bahagiCompletionMap.get(bahagis[i].id)) {
        highestCompletedIndex = i;
      }
    }

    console.log(`[GET /api/student/teacher-lessons] Highest completed bahagi index: ${highestCompletedIndex}`);

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
          let completedAssessments = 0;
          let totalAssessments = 0;
          try {
            const progressResult = await query(
              `SELECT COUNT(*) as passed_count FROM lesson_progress
               WHERE student_id = $1 AND lesson_id IN (SELECT id FROM lesson WHERE bahagi_id = $2) AND completed = true`,
              [studentId, bahagi.id]
            );
            passedYunits = parseInt(progressResult.rows[0]?.passed_count || 0);

            // Count total assessments for this bahagi
            const totalAssessmentsResult = await query(
              `SELECT COUNT(*) as total FROM bahagi_assessment WHERE bahagi_id = $1 AND (is_archived IS NULL OR is_archived = false)`,
              [bahagi.id]
            );
            totalAssessments = parseInt(totalAssessmentsResult.rows[0]?.total || 0);

            // Count assessments the student has answered
            if (totalAssessments > 0) {
              const completedAssessmentsResult = await query(
                `SELECT COUNT(DISTINCT ar.assessment_id) as completed FROM assessment_responses ar
                 WHERE ar.student_id = $1 AND ar.assessment_id IN (
                   SELECT id FROM bahagi_assessment WHERE bahagi_id = $2 AND (is_archived IS NULL OR is_archived = false)
                 )`,
                [studentId, bahagi.id]
              );
              completedAssessments = parseInt(completedAssessmentsResult.rows[0]?.completed || 0);
            }
            
            // Detailed logging for debugging
            console.log(`[Bahagi ${bahagiIndex}] "${bahagi.title}":`);
            console.log(`  - Student ID: ${studentId}`);
            console.log(`  - Bahagi ID: ${bahagi.id}`);
            console.log(`  - Passed Yunits Query Result:`, progressResult.rows[0]);
            console.log(`  - Completed Yunits: ${passedYunits}/${yunitResult.rows.length}`);
            
            // Get individual lesson details for debugging
            if (passedYunits === 0 && yunitResult.rows.length > 0) {
              const debugLessons = await query(
                `SELECT l.id, l.title, lp.completed, lp.student_id, lp.created_at
                 FROM lesson l
                 LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.student_id = $1
                 WHERE l.bahagi_id = $2
                 ORDER BY l.lesson_order ASC`,
                [studentId, bahagi.id]
              );
              console.log(`  - Individual Lesson Status:`);
              debugLessons.rows.forEach((lesson: any) => {
                console.log(`    * ${lesson.title}: ${lesson.completed === null ? 'No Progress' : lesson.completed ? 'Completed ✓' : 'Started (not completed)'} | student_id match: ${lesson.student_id === studentId}`);
              });
            }
          } catch (err) {
            console.warn(`Could not fetch progress for bahagi ${bahagi.id}:`, err);
          }

          const totalYunits = yunitResult.rows.length;
          const totalItems = totalYunits + totalAssessments;
          const completedItems = passedYunits + completedAssessments;
          const allPassed = totalItems > 0 && completedItems === totalItems;
          
          console.log(`[Bahagi ${bahagiIndex}] Progress: ${passedYunits}/${totalYunits} yunits (${allPassed ? 'COMPLETE' : 'INCOMPLETE'})`);

          // Improved unlock logic:
          // - First lesson (index 0) is always unlocked
          // - Unlock the next lesson after the highest COMPLETED bahagi
          // - This ensures students must complete a bahagi before the next unlocks
          const isUnlocked = bahagiIndex === 0 || bahagiIndex <= highestCompletedIndex + 1;

        const lessonData = {
          id: bahagi.id,
          bahagiNumber: bahagiIndex + 1,
          title: bahagi.title || `Lesson ${bahagiIndex + 1}`,
          description: bahagi.description || '',
          imageUrl: bahagi.image_url || '/Character/NLLCTeachHalf1.png',
          yunitCount: totalYunits,
          yunits: yunitResult?.rows || [],
          passedYunits: passedYunits,
          totalYunits: totalYunits,
          isCompleted: allPassed,
          isUnlocked,
          xpReward: 10,
          quarter: bahagi.quarter || null,
          week_number: bahagi.week_number || null,
          module_number: bahagi.module_number || null
        };
        
        console.log(`[Bahagi ${bahagiIndex}] Lesson data:`, {
          title: lessonData.title,
          quarter: lessonData.quarter,
          week_number: lessonData.week_number,
          module_number: lessonData.module_number
        });
        
        console.log(`[GET /api/student/teacher-lessons] Lesson ${bahagiIndex + 1} mapped:`, { id: lessonData.id, title: lessonData.title, originalTitle: bahagi.title });
        
        return lessonData;
        } catch (lessonErr: any) {
          console.error(`Error processing bahagi ${bahagi.id}:`, lessonErr);
          return {
            id: bahagi.id,
            bahagiNumber: bahagiIndex + 1,
            title: bahagi.title || `Lesson ${bahagiIndex + 1}`,
            description: bahagi.description || '',
            imageUrl: bahagi.image_url || '/Character/NLLCTeachHalf1.png',
            yunitCount: 0,
            yunits: [],
            passedYunits: 0,
            totalYunits: 0,
            isCompleted: false,
            isUnlocked: bahagiIndex === 0,
            xpReward: 10,
            quarter: bahagi.quarter || null,
            week_number: bahagi.week_number || null,
            module_number: bahagi.module_number || null
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
