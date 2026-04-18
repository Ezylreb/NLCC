import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    console.log('[DELETE BAHAGI] Attempting to delete bahagi:', id);

    // The foreign key constraints have ON DELETE CASCADE,
    // so deleting the bahagi will automatically delete:
    // - lesson (yunits)
    // - bahagi_assessment
    // - bahagi_reward
    const result = await query(
      `DELETE FROM bahagi WHERE id = $1 RETURNING id, title`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      console.log('[DELETE BAHAGI] Bahagi not found:', id);
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    console.log('[DELETE BAHAGI] Successfully deleted:', result.rows[0]);
    return NextResponse.json({
      success: true,
      message: 'Bahagi and all related content deleted permanently',
      bahagi: result.rows[0]
    });
  } catch (error: any) {
    console.error('[DELETE BAHAGI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete bahagi', details: error?.message },
      { status: 500 }
    );
  }
}
