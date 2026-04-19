/**
 * Get specific Assessment by ID
 * GET /api/rest/assessments/[id]
 */

import { NextResponse } from 'next/server';
import AssessmentService from '@/lib/services/AssessmentService';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const assessment = await AssessmentService.getById(id);

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error: any) {
    console.error('[GET /api/rest/assessments/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment', detail: error.message },
      { status: 500 }
    );
  }
}
