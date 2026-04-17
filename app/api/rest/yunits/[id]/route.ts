/**
 * Get specific Yunit by ID
 * GET /api/rest/yunits/[id]
 */

import { NextResponse } from 'next/server';
import YunitService from '@/lib/services/YunitService';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const yunit = await YunitService.getWithAssessments(id);

    if (!yunit) {
      return NextResponse.json(
        { error: 'Yunit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: yunit });
  } catch (error: any) {
    console.error('[GET /api/rest/yunits/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch yunit', detail: error.message },
      { status: 500 }
    );
  }
}
