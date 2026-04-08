import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bahagiId } = await params;
    const { type, title, content, assessment_order } = await request.json();

    if (!bahagiId) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Assessment type and title are required' },
        { status: 400 }
      );
    }

    // Validate assessment type
    const validTypes = ['multiple-choice', 'audio', 'drag-drop', 'matching'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid assessment type. Allowed: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify bahagi exists
    const bahagiCheck = await query('SELECT id FROM bahagi WHERE id = $1', [bahagiId]);
    if (bahagiCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bahagi not found' },
        { status: 404 }
      );
    }

    // Get next assessment order if not provided
    let nextOrder = assessment_order;
    if (nextOrder === undefined) {
      const orderResult = await query(
        'SELECT COALESCE(MAX(assessment_order), 0) + 1 as next_order FROM bahagi_assessment WHERE bahagi_id = $1',
        [bahagiId]
      );
      nextOrder = orderResult.rows[0].next_order;
    }

    const result = await query(
      `INSERT INTO bahagi_assessment (bahagi_id, type, title, content, assessment_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, bahagi_id, type, title, content, assessment_order, created_at, updated_at`,
      [bahagiId, type, title, content ? JSON.stringify(content) : null, nextOrder]
    );

    return NextResponse.json({ assessment: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bahagiId } = await params;

    if (!bahagiId) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT id, bahagi_id, type, title, content, assessment_order, created_at, updated_at
       FROM bahagi_assessment
       WHERE bahagi_id = $1
       ORDER BY assessment_order ASC`,
      [bahagiId]
    );

    return NextResponse.json({ assessments: result.rows });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
