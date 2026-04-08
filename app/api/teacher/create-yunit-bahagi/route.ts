import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, mediaUrl, bahagiId, teacherId } = body;

    if (!title || !content || !bahagiId || !teacherId) {
      return NextResponse.json(
        { error: 'Title, content, bahagi ID, and teacher ID are required' },
        { status: 400 }
      );
    }

    // Verify bahagi exists
    const bahagiCheck = await query(
      `SELECT id, title FROM bahagi WHERE id = $1`,
      [bahagiId]
    );

    if (bahagiCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    // Create yunit linked to bahagi
    const result = await query(
      `INSERT INTO yunits (title, content, media_url, bahagi_id, teacher_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, title, content, media_url, bahagi_id, teacher_id, created_at`,
      [title, content, mediaUrl || null, bahagiId, teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create yunit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      yunit: result.rows[0]
    });
  } catch (error: any) {
    console.error('CRITICAL: Create Yunit Error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail
    });
    return NextResponse.json(
      { error: 'Failed to create yunit', details: error?.message },
      { status: 500 }
    );
  }
}
