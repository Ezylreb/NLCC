import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Yunit ID is required' },
        { status: 400 }
      );
    }

    // Delete all answer records related to assessments in this lesson
    await query(
      `DELETE FROM yunit_answers 
       WHERE assessment_id IN (
         SELECT id FROM bahagi_assessment WHERE lesson_id = $1
       )`,
      [id]
    );

    // Delete all assessments for this lesson
    await query(
      `DELETE FROM bahagi_assessment WHERE lesson_id = $1`,
      [id]
    );

    // Delete student progress for this lesson
    await query(
      `DELETE FROM lesson_progress WHERE lesson_id = $1`,
      [id]
    );

    // Delete the lesson itself
    const result = await query(
      `DELETE FROM lesson WHERE id = $1 RETURNING id, title, bahagi_id`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Yunit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Yunit and all related assessments deleted permanently',
      yunit: result.rows[0]
    });
  } catch (error: any) {
    console.error('Delete Yunit Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete yunit', details: error?.message },
      { status: 500 }
    );
  }
}
