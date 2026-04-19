import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function ensureRewardBadgesColumn() {
  await query(`
    ALTER TABLE classes
    ADD COLUMN IF NOT EXISTS reward_badges JSONB DEFAULT '[]'::jsonb
  `);
}

/**
 * GET /api/teacher/classes/[id]
 * Fetch a single class by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await ensureRewardBadgesColumn();

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Build query with optional teacher verification
    let queryText = `
      SELECT 
        c.id,
        c.name,
        c.teacher_id,
        c.is_archived,
        COALESCE(c.reward_badges, '[]'::jsonb) as reward_badges,
        c.created_at,
        c.updated_at,
        (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id)::INT as student_count,
        (SELECT COUNT(*) FROM bahagi b WHERE b.class_name = c.name)::INT as lesson_count
      FROM classes c
      WHERE c.id = $1
    `;
    const queryParams: any[] = [id];

    // If teacherId provided, verify ownership
    if (teacherId) {
      queryText += ` AND c.teacher_id = $2`;
      queryParams.push(teacherId);
    }

    const result = await query(queryText, queryParams);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teacher/classes/[id]
 * Update a class (including archiving)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await ensureRewardBadgesColumn();

    const { id } = await context.params;
    const body = await request.json();
    const { name, is_archived, reward_badges, teacherId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Verify teacher ownership if teacherId provided
    if (teacherId) {
      const verifyResult = await query(
        `SELECT id FROM classes WHERE id = $1 AND teacher_id = $2`,
        [id, teacherId]
      );

      if (!verifyResult.rows || verifyResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Class not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (is_archived !== undefined) {
      updates.push(`is_archived = $${paramIndex++}`);
      values.push(is_archived);
    }

    if (reward_badges !== undefined) {
      updates.push(`reward_badges = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(reward_badges));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(id); // Last parameter is the class ID

    const updateQuery = `
      UPDATE classes
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, teacher_id, is_archived, COALESCE(reward_badges, '[]'::jsonb) as reward_badges, created_at, updated_at
    `;

    const result = await query(updateQuery, values);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update class' },
        { status: 500 }
      );
    }

    const updatedClass = result.rows[0];

    // Get updated counts
    const countsResult = await query(
      `SELECT 
        (SELECT COUNT(*) FROM class_enrollments WHERE class_id = $1)::INT as student_count,
        (SELECT COUNT(*) FROM bahagi WHERE class_name = $2)::INT as lesson_count
      `,
      [id, updatedClass.name]
    );

    const counts = countsResult.rows?.[0] || { student_count: 0, lesson_count: 0 };

    console.log(`✅ Class ${is_archived ? 'archived' : 'updated'}: ${updatedClass.name} (${id})`);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedClass,
        student_count: counts.student_count,
        lesson_count: counts.lesson_count
      }
    });
  } catch (error: any) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update class' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/classes/[id]
 * Delete a class (hard delete)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Verify teacher ownership if provided
    if (teacherId) {
      const verifyResult = await query(
        `SELECT id, name FROM classes WHERE id = $1 AND teacher_id = $2`,
        [id, teacherId]
      );

      if (!verifyResult.rows || verifyResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Class not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    // Delete the class (cascade will handle enrollments)
    const result = await query(
      `DELETE FROM classes WHERE id = $1 RETURNING name`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Class deleted: ${result.rows[0].name} (${id})`);

    return NextResponse.json({
      success: true,
      data: { message: 'Class deleted successfully' }
    });
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete class' },
      { status: 500 }
    );
  }
}
