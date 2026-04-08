import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, instructions, reward, classId, lessonId, questions, teacherId } = body;

    if (!title || !type || !lessonId || !teacherId) {
      return NextResponse.json(
        { error: 'Title, type, lesson ID, and teacher ID are required' },
        { status: 400 }
      );
    }

    // Validate assessment type
    const validTypes = ['multiple-choice', 'short-answer', 'checkbox', 'media-audio', 'scramble', 'matching'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid assessment type' },
        { status: 400 }
      );
    }

    // Create assessment in database
    const result = await query(
      `INSERT INTO assessments (title, type, instructions, reward, lesson_id, class_id, teacher_id, questions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, title, type, instructions, reward, lesson_id, class_id, teacher_id, questions, created_at, updated_at`,
      [title, type, instructions || null, reward || 10, lessonId, classId || null, teacherId, JSON.stringify(questions || [])]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      );
    }

    const assessmentData = result.rows[0];

    return NextResponse.json({
      assessment: {
        id: assessmentData.id,
        title: assessmentData.title,
        type: assessmentData.type,
        instructions: assessmentData.instructions,
        reward: assessmentData.reward,
        questions: assessmentData.questions,
        created_at: assessmentData.created_at
      }
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
