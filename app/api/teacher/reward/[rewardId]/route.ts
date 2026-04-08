import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;
    const { amount } = await request.json();

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      );
    }

    if (amount === undefined) {
      return NextResponse.json(
        { error: 'amount is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE bahagi_reward SET amount = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [amount, rewardId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reward: result.rows[0] });
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json(
      { error: 'Failed to update reward' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM bahagi_reward WHERE id = $1 RETURNING id',
      [rewardId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json(
      { error: 'Failed to delete reward' },
      { status: 500 }
    );
  }
}
