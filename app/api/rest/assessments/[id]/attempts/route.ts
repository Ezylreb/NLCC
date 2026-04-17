/**
 * Get Assessment Submission Attempts
 * GET /api/rest/assessments/[id]/attempts?studentId=...
 */

import { NextRequest, NextResponse } from 'next/server';
import AssessmentService from '@/lib/services/AssessmentService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const attempts = await AssessmentService.getAttempts(assessmentId, studentId);

    return NextResponse.json({ success: true, data: attempts });
  } catch (error: any) {
    console.error('[GET /api/rest/assessments/[id]/attempts]', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempts', detail: error.message },
      { status: 500 }
    );
  }
}
