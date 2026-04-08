import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, teacherId } = body;

    if (!lessonId || !teacherId) {
      return NextResponse.json(
        { error: 'Lesson ID and Teacher ID are required' },
        { status: 400 }
      );
    }

    // Update lesson status to Published
    const result = await query(
      `UPDATE lessons 
       SET status = 'Published', updated_at = NOW()
       WHERE id = $1 AND teacher_id = $2
       RETURNING id, title, status, updated_at`,
      [lessonId, teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found or not owned by this teacher' },
        { status: 404 }
      );
    }

    console.log(`✅ Lesson published: ${lessonId}`);

    return NextResponse.json({
      success: true,
      lesson: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error publishing lesson:', error.message);
    return NextResponse.json(
      { error: 'Failed to publish lesson', details: error.message },
      { status: 500 }
    );
  }
}
