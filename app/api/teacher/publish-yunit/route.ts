import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { yunitId, teacherId } = body;

    if (!yunitId || !teacherId) {
      return NextResponse.json(
        { error: 'Yunit ID and Teacher ID are required' },
        { status: 400 }
      );
    }

    // Update yunit - mark as published by setting a published_at timestamp
    const result = await query(
      `UPDATE yunits 
       SET published_at = CASE WHEN published_at IS NULL THEN NOW() ELSE published_at END
       WHERE id = $1 AND teacher_id = $2
       RETURNING id, title, published_at`,
      [yunitId, teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Yunit not found or not owned by this teacher' },
        { status: 404 }
      );
    }

    console.log(`✅ Yunit published: ${yunitId}`);

    return NextResponse.json({
      success: true,
      yunit: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error publishing yunit:', error.message);
    return NextResponse.json(
      { error: 'Failed to publish yunit', details: error.message },
      { status: 500 }
    );
  }
}
