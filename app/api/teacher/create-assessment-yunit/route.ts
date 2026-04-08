import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, yunitId, assessmentType, questions, teacherId } = body;

    if (!title || !yunitId || !assessmentType || !teacherId) {
      return NextResponse.json(
        { error: 'Title, yunit ID, assessment type, and teacher ID are required' },
        { status: 400 }
      );
    }

    // Verify yunit exists
    const yunitCheck = await query(
      `SELECT id, title FROM yunits WHERE id = $1`,
      [yunitId]
    );

    if (yunitCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Yunit not found' },
        { status: 404 }
      );
    }

    // Create assessment linked to yunit
    const result = await query(
      `INSERT INTO assessments (title, yunit_id, assessment_type, questions, teacher_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, title, yunit_id, assessment_type, questions, teacher_id, created_at`,
      [title, yunitId, assessmentType, questions ? JSON.stringify(questions) : null, teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assessment: result.rows[0]
    });
  } catch (error: any) {
    console.error('CRITICAL: Create Assessment Error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail
    });
    return NextResponse.json(
      { error: 'Failed to create assessment', details: error?.message },
      { status: 500 }
    );
  }
}
