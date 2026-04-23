import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔧 [UPDATE-BAHAGI] Received request body:', JSON.stringify(body, null, 2));
    
    const { id, title, description, isPublished, is_published, iconPath, iconType, quarter, week_number, module_number } = body;
    const publishValue = isPublished !== undefined ? isPublished : is_published;
    console.log('🔧 [UPDATE-BAHAGI] Parsed fields:', { id, title, description, isPublished: publishValue, iconPath, iconType, quarter, week_number, module_number });

    if (!id) {
      console.error('🔧 [UPDATE-BAHAGI] Validation failed: Missing id');
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Build update fields
    const updateFields: string[] = ['updated_at = NOW()'];
    const updateValues: any[] = [];
    let paramCount = 1;

    // Title (optional)
    if (title !== undefined) {
      updateFields.push(`title = $${paramCount}`);
      updateValues.push(title);
      paramCount++;
    }

    // Description (optional)
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(description || null);
      paramCount++;
    }

    // Quarter (optional)
    if (quarter !== undefined) {
      updateFields.push(`quarter = $${paramCount}`);
      updateValues.push(quarter || null);
      paramCount++;
    }

    // Week Number (optional)
    if (week_number !== undefined) {
      updateFields.push(`week_number = $${paramCount}`);
      updateValues.push(week_number || null);
      paramCount++;
    }

    // Module Number (optional)
    if (module_number !== undefined) {
      updateFields.push(`module_number = $${paramCount}`);
      updateValues.push(module_number || null);
      paramCount++;
    }

    // Publish status (schema-compatible: prefer is_published, fallback to is_open)
    if (publishValue !== undefined) {
      const columnCheck = await query(
        `SELECT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_name = 'bahagi' AND column_name = 'is_published'
         ) AS has_is_published`
      );

      const hasIsPublished = Boolean(columnCheck.rows?.[0]?.has_is_published);
      const publishColumn = hasIsPublished ? 'is_published' : 'is_open';
      updateFields.push(`${publishColumn} = $${paramCount}`);
      updateValues.push(publishValue);
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
       RETURNING *`;

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
    if (updatedBahagi && updatedBahagi.is_published === undefined && updatedBahagi.is_open !== undefined) {
      updatedBahagi.is_published = Boolean(updatedBahagi.is_open);
    }
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
