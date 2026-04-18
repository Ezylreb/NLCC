import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔧 [UPDATE-BAHAGI] Received request body:', JSON.stringify(body, null, 2));
    
    const { id, title, description, isPublished, iconPath, iconType } = body;
    console.log('🔧 [UPDATE-BAHAGI] Parsed fields:', { id, title, description, isPublished, iconPath, iconType });

    if (!id || !title) {
      console.error('🔧 [UPDATE-BAHAGI] Validation failed: Missing id or title');
      return NextResponse.json(
        { error: 'ID and title are required' },
        { status: 400 }
      );
    }

    // Build update fields
    const updateFields: string[] = ['updated_at = NOW()'];
    const updateValues: any[] = [];
    let paramCount = 1;

    // Title
    updateFields.push(`title = $${paramCount}`);
    updateValues.push(title);
    paramCount++;

    // Description
    updateFields.push(`description = $${paramCount}`);
    updateValues.push(description || null);
    paramCount++;

    // Is Open (not is_published)
    if (isPublished !== undefined) {
      updateFields.push(`is_open = $${paramCount}`);
      updateValues.push(isPublished);
      paramCount++;
    }

    // Icon Path
    if (iconPath) {
      updateFields.push(`icon_path = $${paramCount}`);
      updateValues.push(iconPath);
      paramCount++;
    }

    // Icon Type
    if (iconType) {
      updateFields.push(`icon_type = $${paramCount}`);
      updateValues.push(iconType);
      paramCount++;
    }

    // ID for WHERE clause
    updateValues.push(id);

    const updateQuery = `UPDATE bahagi 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, title, description, is_open, icon_path, icon_type, created_at, updated_at`;

    console.log('🔧 [UPDATE-BAHAGI] Update Query:', updateQuery);
    console.log('🔧 [UPDATE-BAHAGI] Update Values:', updateValues);

    const result = await query(updateQuery, updateValues);
    
    console.log('🔧 [UPDATE-BAHAGI] Query executed successfully');
    console.log('🔧 [UPDATE-BAHAGI] Query Result rows:', result.rows);
    console.log('🔧 [UPDATE-BAHAGI] Query Result count:', result.rows?.length);

    if (!result.rows || result.rows.length === 0) {
      console.error('🔧 [UPDATE-BAHAGI] Bahagi not found for id:', id);
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    const updatedBahagi = result.rows[0];
    console.log('🔧 [UPDATE-BAHAGI] Successfully updated bahagi:', JSON.stringify(updatedBahagi, null, 2));
    return NextResponse.json({
      success: true,
      bahagi: updatedBahagi,
      data: updatedBahagi, // Also include as 'data' for consistency
    });
  } catch (error: any) {
    console.error('❌ [UPDATE-BAHAGI] Error:', error);
    console.error('❌ [UPDATE-BAHAGI] Error Message:', error?.message);
    console.error('❌ [UPDATE-BAHAGI] Error Stack:', error?.stack);
    return NextResponse.json(
      { error: 'Failed to update bahagi', details: error?.message },
      { status: 500 }
    );
  }
}
