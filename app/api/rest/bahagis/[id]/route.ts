/**
 * Get specific Bahagi by ID
 * GET /api/rest/bahagis/[id]
 */

import { NextResponse } from 'next/server';
import BahagiService from '@/lib/services/BahagiService';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const bahagi = await BahagiService.getById(id);

    if (!bahagi) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bahagi });
  } catch (error: any) {
    console.error('[GET /api/rest/bahagis/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch bahagi', detail: error.message },
      { status: 500 }
    );
  }
}
