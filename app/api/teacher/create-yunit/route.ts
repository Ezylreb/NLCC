import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('CREATE YUNIT - Received body:', body);
    
    const { title, content, mediaUrl, classId, lessonId, teacherId } = body;

    console.log('CREATE YUNIT - Parsed params:', {
      title: title ? `"${title}"` : 'MISSING',
      content: content ? `"${content.substring(0, 50)}..."` : 'MISSING',
      mediaUrl: mediaUrl || 'not provided',
      classId: classId || 'not provided',
      lessonId: lessonId || 'MISSING',
      teacherId: teacherId || 'MISSING'
    });

    if (!title || !content || !lessonId || !teacherId) {
      return NextResponse.json(
        { error: 'Title, content, lesson ID, and teacher ID are required' },
        { status: 400 }
      );
    }

    // Create yunit in database
    console.log('CREATE YUNIT - About to INSERT with params:', [title, content, mediaUrl || null, lessonId, classId || null, teacherId]);
    
    const result = await query(
      `INSERT INTO yunits (title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, title, content, media_url, lesson_id, class_id, teacher_id, created_at, updated_at`,
      [title, content, mediaUrl || null, lessonId, classId || null, teacherId]
    );

    console.log('CREATE YUNIT - Query result:', result);

    if (!result.rows || result.rows.length === 0) {
      console.error('CREATE YUNIT - No rows returned from INSERT');
      return NextResponse.json(
        { error: 'Failed to create yunit' },
        { status: 500 }
      );
    }

    const yunitData = result.rows[0];
    console.log('CREATE YUNIT - Success! Created:', yunitData.id);

    return NextResponse.json({
      yunit: {
        id: yunitData.id,
        title: yunitData.title,
        content: yunitData.content,
        mediaUrl: yunitData.media_url,
        created_at: yunitData.created_at
      }
    });
  } catch (error: any) {
    console.error('CRITICAL: Create Yunit Error:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        detail: error?.detail
    });
    return NextResponse.json(
      { error: 'Failed to create yunit', details: error.message },
      { status: 500 }
    );
  }
}
