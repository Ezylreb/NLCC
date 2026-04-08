import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { is_open, title, description } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (is_open !== undefined) {
      updates.push(`is_open = $${paramCount++}`);
      values.push(is_open);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE bahagi SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ bahagi: result.rows[0] });
  } catch (error) {
    console.error('Error updating bahagi:', error);
    return NextResponse.json(
      { error: 'Failed to update bahagi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    // Delete should cascade to lessons, assessments, and rewards
    const result = await query(
      'DELETE FROM bahagi WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Bahagi deleted successfully' });
  } catch (error) {
    console.error('Error deleting bahagi:', error);
    return NextResponse.json(
      { error: 'Failed to delete bahagi' },
      { status: 500 }
    );
  }
}
