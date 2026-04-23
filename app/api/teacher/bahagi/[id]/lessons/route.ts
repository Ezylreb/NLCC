import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Allow large request bodies for base64 audio/image uploads
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bahagiId } = await params;
    const { title, subtitle, discussion, lesson_order, media_url, audio_url, quarter, week_number, module_number } = await request.json();

    if (!bahagiId) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Lesson title is required' },
        { status: 400 }
      );
    }

    // Verify bahagi exists
    const bahagiCheck = await query('SELECT id FROM bahagi WHERE id = $1', [bahagiId]);
    if (bahagiCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    // Get next lesson order if not provided
    let nextOrder = lesson_order;
    if (nextOrder === undefined) {
      const orderResult = await query(
        'SELECT COALESCE(MAX(lesson_order), 0) + 1 as next_order FROM lesson WHERE bahagi_id = $1',
        [bahagiId]
      );
      nextOrder = orderResult.rows[0].next_order;
    }

    const normalizedSubtitle = typeof subtitle === 'string'
      ? subtitle.trim().slice(0, 255)
      : null;

    // Insert lesson with media URLs
    console.log('[POST lesson] Creating lesson:', { bahagiId, title, subtitle, discussion, nextOrder, has_media: !!media_url, has_audio: !!audio_url });
    const result = await query(
      `INSERT INTO lesson (bahagi_id, title, subtitle, discussion, lesson_order, media_url, audio_url, quarter, week_number, module_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, bahagi_id, title, subtitle, discussion, lesson_order, media_url, audio_url, quarter, week_number, module_number, created_at, updated_at`,
      [bahagiId, title, normalizedSubtitle, discussion || null, nextOrder, media_url || null, audio_url || null, quarter || null, week_number || null, module_number || null]
    );
    
    console.log('[POST lesson] Lesson created successfully with ID:', result.rows[0].id);

    return NextResponse.json({ lesson: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bahagiId } = await params;

    if (!bahagiId) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT id, bahagi_id, title, subtitle, discussion, lesson_order, created_at, updated_at
       FROM lesson
       WHERE bahagi_id = $1
       ORDER BY lesson_order ASC`,
      [bahagiId]
    );

    return NextResponse.json({ lessons: result.rows });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}
