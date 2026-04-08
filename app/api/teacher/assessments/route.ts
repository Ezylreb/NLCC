import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yunitId = searchParams.get('yunitId');

    if (!yunitId) {
      return NextResponse.json({ error: 'Yunit ID required' }, { status: 400 });
    }

    const result = await query(
      `SELECT * FROM assessments 
       WHERE yunit_id = $1 
       ORDER BY created_at ASC`,
      [yunitId]
    );

    return NextResponse.json({ assessments: result.rows });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { yunitId, title, assessmentType, questionData, xpReward, coinsReward } = await request.json();

    if (!yunitId || !title || !assessmentType) {
      return NextResponse.json({ error: 'Yunit ID, title, and assessment type required' }, { status: 400 });
    }

    // Validate assessment type
    const validTypes = ['multiple_choice', 'audio_input', 'drag_drop', 'matching'];
    if (!validTypes.includes(assessmentType)) {
      return NextResponse.json({ error: 'Invalid assessment type' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO assessments (yunit_id, title, assessment_type, question_data, xp_reward, coins_reward)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [yunitId, title, assessmentType, JSON.stringify(questionData || {}), xpReward || 10, coinsReward || 5]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, assessmentType, questionData, xpReward, coinsReward } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE assessments 
       SET title = $1, assessment_type = $2, question_data = $3, xp_reward = $4, coins_reward = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, assessmentType, JSON.stringify(questionData || {}), xpReward || 10, coinsReward || 5, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });
    }

    await query('DELETE FROM assessments WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
  }
}
