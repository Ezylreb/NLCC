/**
 * File Upload REST API
 * POST /api/rest/upload - Upload file to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/database/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'lesson-images';
    const path = (formData.get('path') as string) || `${Date.now()}-${file.name}`;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine content type
    const contentType = file.type || 'application/octet-stream';

    // Upload to Supabase
    const result = await storage.uploadFile(bucket, path, buffer, { contentType });

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/rest/upload]', error);
    return NextResponse.json(
      { error: 'Failed to upload file', detail: error.message },
      { status: 500 }
    );
  }
}
