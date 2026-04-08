import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { lessonId, primaryText, secondaryText, imageEmoji, pronunciation, itemOrder, linkUrl } = await request.json();

    if (!lessonId || !primaryText) {
      return NextResponse.json({ error: 'Lesson ID and Primary Text are required' }, { status: 400 });
    }

    const insertRes = await query(
      `INSERT INTO lesson_items (lesson_id, primary_text, secondary_text, image_emoji, pronunciation, item_order, link_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [lessonId, primaryText, secondaryText || '', imageEmoji || '⭐', pronunciation || '', itemOrder || 0, linkUrl || null]
    );

    return NextResponse.json({ success: true, item: insertRes.rows[0] });
  } catch (error: any) {
    console.error('CRITICAL: Create Lesson Item Error:', {
        message: error.message,
        detail: error.detail,
        code: error.code
    });
    return NextResponse.json({ 
        error: 'Failed to add lesson item', 
        details: error.message,
        code: error.code
    }, { status: 500 });
  }
}
