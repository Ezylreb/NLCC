/**
 * Consolidated Bahagi REST API
 * Replaces: /api/teacher/bahagi, /api/teacher/create-bahagi, /api/teacher/update-bahagi, etc.
 * 
 * Endpoints:
 * POST   /api/rest/bahagis - Create new bahagi
 * GET    /api/rest/bahagis - List bahagis (filtered by teacher)
 * GET    /api/rest/bahagis/:id - Get specific bahagi
 * PATCH  /api/rest/bahagis/:id - Update bahagi
 * DELETE /api/rest/bahagis/:id - Archive/delete bahagi
 */

import { NextRequest, NextResponse } from 'next/server';
import BahagiService from '@/lib/services/BahagiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[POST /api/rest/bahagis] Received body:', JSON.stringify(body, null, 2));

    // Validate input
    const validation = BahagiService.validateCreateData(body);
    console.log('[POST /api/rest/bahagis] Validation result:', validation);

    if (!validation.valid) {
      console.error('[POST /api/rest/bahagis] Validation errors:', validation.errors);
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Create bahagi
    console.log('[POST /api/rest/bahagis] Creating bahagi...');
    const bahagi = await BahagiService.create(body);
    console.log('[POST /api/rest/bahagis] Bahagi created:', bahagi);

    return NextResponse.json({ success: true, data: bahagi }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/rest/bahagis] Exception:', error);
    console.error('[POST /api/rest/bahagis] Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Failed to create bahagi', detail: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const className = searchParams.get('className');
    const published = searchParams.get('published');
    const archived = searchParams.get('archived');

    console.log('[GET /api/rest/bahagis] Request params:', { teacherId, className, published, archived });

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // List bahagis
    let bahagis = await BahagiService.listByTeacher(teacherId, className || undefined);
    
    console.log(`[GET /api/rest/bahagis] Found ${bahagis.length} bahagi for teacher ${teacherId}${className ? ` in class ${className}` : ''}`);

    // Filter by status
    if (published !== null) {
      const publishedBool = published === 'true';
      bahagis = bahagis.filter((b: any) => b.is_published === publishedBool);
    }

    if (archived !== null) {
      const archivedBool = archived === 'true';
      bahagis = bahagis.filter((b: any) => b.is_archived === archivedBool);
    }

    console.log(`[GET /api/rest/bahagis] After filtering: ${bahagis.length} bahagi`);

    return NextResponse.json({ success: true, data: bahagis });
  } catch (error: any) {
    console.error('[GET /api/rest/bahagis]', error);
    return NextResponse.json(
      { error: 'Failed to fetch bahagis', detail: error.message },
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
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update bahagi
    const bahagi = await BahagiService.update(id, body);

    if (!bahagi) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bahagi });
  } catch (error: any) {
    console.error('[PATCH /api/rest/bahagis]', error);
    return NextResponse.json(
      { error: 'Failed to update bahagi', detail: error.message },
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
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    // Archive (soft delete) by default, or delete permanently if specified
    const result = permanent
      ? await BahagiService.delete(id)
      : await BahagiService.archive(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Bahagi deleted permanently' : 'Bahagi archived',
    });
  } catch (error: any) {
    console.error('[DELETE /api/rest/bahagis]', error);
    return NextResponse.json(
      { error: 'Failed to delete bahagi', detail: error.message },
      { status: 500 }
    );
  }
}
