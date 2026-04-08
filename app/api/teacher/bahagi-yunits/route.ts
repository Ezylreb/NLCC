import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const bahagiId = request.nextUrl.searchParams.get('bahagiId');

    if (!bahagiId) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT id, title, content, media_url, bahagi_id, teacher_id, published_at, created_at 
       FROM yunits 
       WHERE bahagi_id = $1
       ORDER BY created_at DESC`,
      [parseInt(bahagiId)]
    );

    return NextResponse.json({
      yunits: result.rows
    });
  } catch (error: any) {
    console.error('CRITICAL: Get Bahagi Yunits Error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail
    });
    return NextResponse.json(
      { error: 'Failed to retrieve yunits', details: error?.message },
      { status: 500 }
    );
  }
}
