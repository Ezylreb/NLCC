import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, teacherId } = body;

    if (!assessmentId || !teacherId) {
      return NextResponse.json(
        { error: 'Assessment ID and Teacher ID are required' },
        { status: 400 }
      );
    }

    // Update assessment - mark as published
    const result = await query(
      `UPDATE assessments 
       SET published_at = CASE WHEN published_at IS NULL THEN NOW() ELSE published_at END
       WHERE id = $1 AND teacher_id = $2
       RETURNING id, title, published_at`,
      [assessmentId, teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found or not owned by this teacher' },
        { status: 404 }
      );
    }

    console.log(`✅ Assessment published: ${assessmentId}`);

    return NextResponse.json({
      success: true,
      assessment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error publishing assessment:', error.message);
    return NextResponse.json(
      { error: 'Failed to publish assessment', details: error.message },
      { status: 500 }
    );
  }
}
