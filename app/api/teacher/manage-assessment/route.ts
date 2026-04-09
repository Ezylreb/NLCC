import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { bahagiId, classId, lessonId, title, type, options, correctAnswer, points, reward, questions, instructions } = body;

    if (!bahagiId && classId) {
      bahagiId = classId;
    }

    // Validate type field
    if (!type) {
      // If type not provided but we have questions, use first question's type
      if (questions && questions.length > 0) {
        type = questions[0].type;
      } else {
        return NextResponse.json(
          { error: 'Assessment type is required' },
          { status: 400 }
        );
      }
    }

    // Map alternative type names
    const typeMap: {[key: string]: string} = {
      'media-audio': 'audio',
      'scramble': 'scramble-word'
    };
    if (typeMap[type]) {
      type = typeMap[type];
    }

    // Validate required fields
    if (!bahagiId || !title) {
      return NextResponse.json(
        { error: 'Bahagi ID and title are required' },
        { status: 400 }
      );
    }

    // Validate assessment type
    const validTypes = [
      'multiple-choice',
      'short-answer',
      'checkbox',
      'audio',
      'matching',
      'scramble-word'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid assessment type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate questions array
    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    // Validate question types
    for (const q of questions) {
      if (!q.type || !validTypes.includes(q.type.replace('media-audio', 'audio').replace('scramble', 'scramble-word'))) {
        return NextResponse.json(
          { error: `Invalid question type: ${q.type}` },
          { status: 400 }
        );
      }
    }

    const pointsValue = points ? parseInt(points) : (reward ? parseInt(reward) : 10);

    // Insert assessment with full content
    let result;
    try {
      // Normalize question types
      const normalizedQuestions = questions.map((q: any) => ({
        ...q,
        type: typeMap[q.type] || q.type
      }));

      result = await query(
        `INSERT INTO bahagi_assessment (
          bahagi_id, lesson_id, title, type, content, assessment_order, is_published, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id, bahagi_id, lesson_id, title, type, content, created_at, updated_at`,
        [
          bahagiId,
          lessonId || null,
          title,
          type,
          JSON.stringify({
            instructions: instructions || '',
            questions: normalizedQuestions,
            totalPoints: pointsValue,
            createdAt: new Date().toISOString()
          }),
          0,
          true
        ]
      );
    } catch (e: any) {
      console.error('Database error:', e?.message);
      return NextResponse.json(
        { error: 'Failed to create assessment in database', details: e?.message },
        { status: 500 }
      );
    }

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      );
    }

    const assessment = result.rows[0];
    
    // Parse content if it's a string
    if (assessment.content && typeof assessment.content === 'string') {
      assessment.content = JSON.parse(assessment.content);
    }

    return NextResponse.json({
      success: true,
      assessment: assessment,
      message: `Assessment "${title}" created successfully with ${questions.length} question(s)`
    });
  } catch (error: any) {
    console.error('Create Assessment Error:', error?.message, error?.stack);
    return NextResponse.json(
      { error: 'Failed to create assessment', details: error?.message },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const bahagiId = request.nextUrl.searchParams.get('bahagiId');
    const lessonId = request.nextUrl.searchParams.get('lessonId');

    if (!bahagiId) {
      return NextResponse.json(
        { assessments: [], error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    let result;
    try {
      // Try with enhanced schema first
      let queryStr = `SELECT id, bahagi_id, lesson_id, title, type, content, assessment_order, is_published, is_archived, created_at, updated_at
                      FROM bahagi_assessment
                      WHERE bahagi_id = $1`;
      let params: any[] = [bahagiId];

      if (lessonId) {
        queryStr += ` AND lesson_id = $2`;
        params.push(lessonId);
      }

      queryStr += ` ORDER BY assessment_order ASC, created_at DESC`;

      result = await query(queryStr, params);
    } catch (e: any) {
      // Fall back to base schema
      if (e.message?.includes('column') || e.message?.includes('does not exist')) {
        const baseQueryStr = `SELECT id, bahagi_id, title, type, content, assessment_order, created_at
                             FROM bahagi_assessment
                             WHERE bahagi_id = $1
                             ORDER BY assessment_order ASC, created_at DESC`;
        result = await query(baseQueryStr, [bahagiId]);
      } else {
        throw e;
      }
    }

    // Transform response to parse JSONB content and add additional metadata
    const assessments = (result.rows || []).map(row => {
      const assessment: any = { ...row };
      
      // Parse content JSON if present
      if (row.content) {
        try {
          if (typeof row.content === 'string') {
            assessment.content = JSON.parse(row.content);
          }
          // Extract questions from content for easy access
          if (assessment.content?.questions) {
            assessment.questions = assessment.content.questions;
            assessment.instructions = assessment.content.instructions || '';
          }
        } catch (e) {
          console.error('Error parsing assessment content:', e);
          assessment.content = row.content;
        }
      }

      return assessment;
    });

    return NextResponse.json({ 
      assessments,
      count: assessments.length,
      success: true
    });
  } catch (error: any) {
    console.error('Get Assessments Error:', error?.message);
    return NextResponse.json(
      { assessments: [], error: 'Failed to fetch assessments', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, bahagiId, title, type, instructions, questions } = body;

    // Validate required fields
    if (!id || !bahagiId || !title) {
      return NextResponse.json(
        { error: 'ID, Bahagi ID, and title are required' },
        { status: 400 }
      );
    }

    // Validate assessment type
    const validTypes = [
      'multiple-choice',
      'short-answer',
      'checkbox',
      'audio',
      'matching',
      'scramble-word'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid assessment type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate questions array
    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    // Validate question types
    for (const q of questions) {
      const qType = q.type.replace('media-audio', 'audio').replace('scramble', 'scramble-word');
      if (!q.type || !validTypes.includes(qType)) {
        return NextResponse.json(
          { error: `Invalid question type: ${q.type}` },
          { status: 400 }
        );
      }
    }

    // Normalize question types
    const typeMap: {[key: string]: string} = {
      'media-audio': 'audio',
      'scramble': 'scramble-word'
    };

    const normalizedQuestions = questions.map((q: any) => ({
      ...q,
      type: typeMap[q.type] || q.type
    }));

    // Update assessment in database
    const result = await query(
      `UPDATE bahagi_assessment 
       SET title = $1, type = $2, content = $3, is_published = true, updated_at = NOW()
       WHERE id = $4 AND bahagi_id = $5
       RETURNING id, bahagi_id, lesson_id, title, type, content, created_at, updated_at`,
      [
        title,
        type,
        JSON.stringify({
          instructions: instructions || '',
          questions: normalizedQuestions,
          totalPoints: 10,
          updatedAt: new Date().toISOString()
        }),
        id,
        bahagiId
      ]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found or not authorized to update' },
        { status: 404 }
      );
    }

    const assessment = result.rows[0];
    
    // Parse content if it's a string
    if (assessment.content && typeof assessment.content === 'string') {
      assessment.content = JSON.parse(assessment.content);
    }

    return NextResponse.json({
      success: true,
      assessment: assessment,
      message: `Assessment "${title}" updated successfully`
    });
  } catch (error: any) {
    console.error('Update Assessment Error:', error?.message, error?.stack);
    return NextResponse.json(
      { error: 'Failed to update assessment', details: error?.message },
      { status: 500 }
    );
  }
}
