import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bahagiId } = await params;
    const { reward_type, amount } = await request.json();

    if (!bahagiId) {
      return NextResponse.json(
        { error: 'Bahagi ID is required' },
        { status: 400 }
      );
    }

    if (!reward_type || amount === undefined) {
      return NextResponse.json(
        { error: 'reward_type and amount are required' },
        { status: 400 }
      );
    }

    // Validate reward type
    const validTypes = ['xp', 'coins'];
    if (!validTypes.includes(reward_type)) {
      return NextResponse.json(
        { error: `Invalid reward_type. Allowed: ${validTypes.join(', ')}` },
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

    // Check if reward already exists for this type
    const existingReward = await query(
      'SELECT id FROM bahagi_reward WHERE bahagi_id = $1 AND reward_type = $2',
      [bahagiId, reward_type]
    );

    let result;
    if (existingReward.rows.length > 0) {
      // Update existing
      result = await query(
        `UPDATE bahagi_reward SET amount = $1, updated_at = NOW() WHERE bahagi_id = $2 AND reward_type = $3
         RETURNING id, bahagi_id, reward_type, amount, created_at, updated_at`,
        [amount, bahagiId, reward_type]
      );
    } else {
      // Insert new
      result = await query(
        `INSERT INTO bahagi_reward (bahagi_id, reward_type, amount)
         VALUES ($1, $2, $3)
         RETURNING id, bahagi_id, reward_type, amount, created_at, updated_at`,
        [bahagiId, reward_type, amount]
      );
    }

    return NextResponse.json({ reward: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error configuring reward:', error);
    return NextResponse.json(
      { error: 'Failed to configure reward' },
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
      `SELECT id, bahagi_id, reward_type, amount, created_at, updated_at
       FROM bahagi_reward
       WHERE bahagi_id = $1
       ORDER BY reward_type ASC`,
      [bahagiId]
    );

    return NextResponse.json({ rewards: result.rows });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
