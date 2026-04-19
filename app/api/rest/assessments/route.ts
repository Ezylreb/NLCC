/**
 * Consolidated Assessment REST API
 * Replaces: /api/teacher/manage-assessment, /api/teacher/create-assessment, /api/teacher/validate-answer, etc.
 * 
 * Endpoints:
 * POST   /api/rest/assessments - Create assessment
 * GET    /api/rest/assessments - List assessments (filtered by bahagi or yunit)
 * GET    /api/rest/assessments/:id - Get specific assessment
 * PATCH  /api/rest/assessments/:id - Update assessment
 * DELETE /api/rest/assessments/:id - Archive/delete assessment
 * POST   /api/rest/assessments/:id/submit - Submit student answer (validates, saves, awards rewards)
 * GET    /api/rest/assessments/:id/attempts - Get student's previous attempts
 */

import { NextRequest, NextResponse } from 'next/server';
import AssessmentService from '@/lib/services/AssessmentService';
import GamificationService from '@/lib/services/GamificationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = AssessmentService.validateCreateData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Create assessment
    const assessment = await AssessmentService.create(body);

    return NextResponse.json({ success: true, data: assessment }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/rest/assessments]', error);
    return NextResponse.json(
      { error: 'Failed to create assessment', detail: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bahagiId = searchParams.get('bahagiId');
    const yunitId = searchParams.get('yunitId');
    const published = searchParams.get('published');

    if (!bahagiId && !yunitId) {
      return NextResponse.json(
        { error: 'Either bahagiId or yunitId is required' },
        { status: 400 }
      );
    }

    let assessments: any[];
    if (yunitId) {
      assessments = await AssessmentService.listByYunit(yunitId);
    } else {
      assessments = await AssessmentService.listByBahagi(bahagiId!);
    }

    // Filter by status
    if (published !== null) {
      const publishedBool = published === 'true';
      assessments = assessments.filter((a) => a.is_published === publishedBool);
    }

    return NextResponse.json({
      success: true,
      data: {
        assessments,
      },
      assessments,
    });
  } catch (error: any) {
    console.error('[GET /api/rest/assessments]', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update assessment
    const assessment = await AssessmentService.update(id, body);

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error: any) {
    console.error('[PATCH /api/rest/assessments]', error);
    return NextResponse.json(
      { error: 'Failed to update assessment', detail: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      );
    }

    // Archive (soft delete) by default
    const result = permanent ? await AssessmentService.delete(id) : await AssessmentService.archive(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Assessment deleted permanently' : 'Assessment archived',
    });
  } catch (error: any) {
    console.error('[DELETE /api/rest/assessments]', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment', detail: error.message },
      { status: 500 }
    );
  }
}
