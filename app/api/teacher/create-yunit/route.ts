import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, mediaUrl, classId, lessonId, teacherId } = body;

    if (!title || !content || !lessonId || !teacherId) {
      return NextResponse.json(
        { error: 'Title, content, lesson ID, and teacher ID are required' },
        { status: 400 }
      );
    }

    // Create yunit in database
    const result = await query(
      `INSERT INTO yunits (title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at`,
      [title, content, mediaUrl || null, lessonId, classId || null, teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create yunit' },
        { status: 500 }
      );
    }

    const yunitData = result.rows[0];

    return NextResponse.json({
      yunit: {
        id: yunitData.id,
        title: yunitData.title,
        content: yunitData.content,
        mediaUrl: yunitData.media_url,
        created_at: yunitData.created_at
      }
    });
  } catch (error) {
    console.error('Error creating yunit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
