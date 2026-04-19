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

    console.log('[GET /api/rest/yunits] Request params:', { bahagiId, published, archived });

    if (!bahagiId) {
      console.error('[GET /api/rest/yunits] Missing bahagiId');
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    const bahagiIdNum = parseInt(bahagiId, 10);
    if (isNaN(bahagiIdNum)) {
      return NextResponse.json(
        { error: 'Invalid Bahagi ID' },
        { status: 400 }
      );
    }

    // List yunits
    console.log('[GET /api/rest/yunits] Calling YunitService.listByBahagi with:', bahagiIdNum);
    let yunits = await YunitService.listByBahagi(String(bahagiIdNum));
    console.log('[GET /api/rest/yunits] YunitService returned:', yunits.length, 'yunits');
    console.log('[GET /api/rest/yunits] First yunit:', yunits[0]);

    // Filter by status
    if (published !== null) {
      const publishedBool = published === 'true';
      yunits = yunits.filter((y: any) => y.is_published === publishedBool);
      console.log('[GET /api/rest/yunits] After published filter:', yunits.length);
    }

    if (archived !== null) {
      const archivedBool = archived === 'true';
      yunits = yunits.filter((y: any) => y.is_archived === archivedBool);
      console.log('[GET /api/rest/yunits] After archived filter:', yunits.length);
    }

    console.log('[GET /api/rest/yunits] Returning:', yunits.length, 'yunits');
    return NextResponse.json({ success: true, data: yunits });
  } catch (error: any) {
    console.error('[GET /api/rest/yunits] Error:', error);
    console.error('[GET /api/rest/yunits] Stack:', error.stack);
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

    // Only allow known lesson columns to prevent SQL errors
    const allowedFields = ['title', 'subtitle', 'discussion', 'media_url', 'audio_url', 'lesson_order', 'is_published', 'is_archived', 'quarter', 'week_number', 'module_number'];
    const sanitized: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        sanitized[key] = body[key];
      }
    }

    // Update yunit
    const yunit = await YunitService.update(id, sanitized);

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

    if (!id) {
      return NextResponse.json(
        { error: 'Yunit ID is required' },
        { status: 400 }
      );
    }

    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: 'Invalid yunit ID' },
        { status: 400 }
      );
    }

    console.log(`[DELETE /api/rest/yunits] Deleting yunit ${idNum}`);

    // Delete permanently
    const result = await YunitService.delete(String(idNum));

    if (!result) {
      return NextResponse.json(
        { error: 'Yunit not found' },
        { status: 404 }
      );
    }

    console.log(`[DELETE /api/rest/yunits] Yunit ${id} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Yunit deleted successfully',
    });
  } catch (error: any) {
    console.error('[DELETE /api/rest/yunits]', error);
    return NextResponse.json(
      { error: 'Failed to delete yunit', detail: error.message },
      { status: 500 }
    );
  }
}
