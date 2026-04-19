/**
 * Get specific Yunit by ID
 * GET /api/rest/yunits/[id]
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch yunit with bahagi icon information
    const result = await query(
      `SELECT 
        l.*,
        b.icon_path as bahagi_icon_path,
        b.icon_type as bahagi_icon_type
       FROM lesson l
       LEFT JOIN bahagi b ON l.bahagi_id = b.id
       WHERE l.id = $1`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Yunit not found' },
        { status: 404 }
      );
    }

    const yunit = result.rows[0];

    return NextResponse.json({ success: true, data: yunit });
  } catch (error: any) {
    console.error('[GET /api/rest/yunits/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch yunit', detail: error.message },
      { status: 500 }
    );
  }
}
