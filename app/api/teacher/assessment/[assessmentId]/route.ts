import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const { type, title, content, assessment_order } = await request.json();

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (type !== undefined) {
      const validTypes = ['multiple-choice', 'audio', 'drag-drop', 'matching'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid assessment type. Allowed: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content ? JSON.stringify(content) : null);
    }

    if (assessment_order !== undefined) {
      updates.push(`assessment_order = $${paramCount++}`);
      values.push(assessment_order);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(assessmentId);

    const result = await query(
      `UPDATE bahagi_assessment SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ assessment: result.rows[0] });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM bahagi_assessment WHERE id = $1 RETURNING id',
      [assessmentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
