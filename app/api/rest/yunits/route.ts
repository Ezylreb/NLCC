/**
 * Consolidated Yunit (Lesson) REST API
 * Replaces: /api/teacher/manage-yunit, /api/teacher/create-yunit, /api/teacher/update-yunit, etc.
 * 
 * Endpoints:
 * POST   /api/rest/yunits - Create yunit
 * GET    /api/rest/yunits - List yunits (filtered by bahagi)
 * GET    /api/rest/yunits/:id - Get specific yunit
 * PATCH  /api/rest/yunits/:id - Update yunit
 * DELETE /api/rest/yunits/:id - Archive/delete yunit
 */

import { NextRequest, NextResponse } from 'next/server';
import YunitService from '@/lib/services/YunitService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = YunitService.validateCreateData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Create yunit
    const yunit = await YunitService.create(body);

    return NextResponse.json({ success: true, data: yunit }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/rest/yunits]', error);
    return NextResponse.json(
      { error: 'Failed to create yunit', detail: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bahagiId = searchParams.get('bahagiId');
    const published = searchParams.get('published');
    const archived = searchParams.get('archived');

    if (!bahagiId) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    // List yunits
    let yunits = await YunitService.listByBahagi(bahagiId);

    // Filter by status
    if (published !== null) {
      const publishedBool = published === 'true';
      yunits = yunits.filter((y: any) => y.is_published === publishedBool);
    }

    if (archived !== null) {
      const archivedBool = archived === 'true';
      yunits = yunits.filter((y: any) => y.is_archived === archivedBool);
    }

    return NextResponse.json({ success: true, data: yunits });
  } catch (error: any) {
    console.error('[GET /api/rest/yunits]', error);
    return NextResponse.json(
      { error: 'Failed to fetch yunits', detail: error.message },
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
        { error: 'Yunit ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update yunit
    const yunit = await YunitService.update(id, body);

    if (!yunit) {
      return NextResponse.json(
        { error: 'Yunit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: yunit });
  } catch (error: any) {
    console.error('[PATCH /api/rest/yunits]', error);
    return NextResponse.json(
      { error: 'Failed to update yunit', detail: error.message },
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
        { error: 'Yunit ID is required' },
        { status: 400 }
      );
    }

    // Archive (soft delete) by default
    const result = permanent ? await YunitService.delete(id) : await YunitService.archive(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Yunit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Yunit deleted permanently' : 'Yunit archived',
    });
  } catch (error: any) {
    console.error('[DELETE /api/rest/yunits]', error);
    return NextResponse.json(
      { error: 'Failed to delete yunit', detail: error.message },
      { status: 500 }
    );
  }
}
