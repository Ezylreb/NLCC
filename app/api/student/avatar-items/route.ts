import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId required' },
        { status: 400 }
      );
    }

    // Get owned items for this student
    const result = await query(
      `SELECT item_id FROM avatar_owned_items 
       WHERE student_id = $1 AND purchased_at IS NOT NULL`,
      [studentId]
    );

    return NextResponse.json({
      items: result.rows.map((r: any) => r.item_id)
    });
  } catch (error) {
    console.error('Error fetching avatar items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, itemId, cost } = await request.json();

    if (!studentId || !itemId || !cost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if already owned
    const existingResult = await query(
      `SELECT * FROM avatar_owned_items 
       WHERE student_id = $1 AND item_id = $2 AND purchased_at IS NOT NULL`,
      [studentId, itemId]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Item already owned' },
        { status: 400 }
      );
    }

    // Check student has enough points
    const rewardsResult = await query(
      `SELECT total_points FROM student_rewards WHERE student_id = $1`,
      [studentId]
    );

    if (!rewardsResult.rows.length) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const totalPoints = rewardsResult.rows[0].total_points || 0;
    if (totalPoints < cost) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      );
    }

    // Insert owned item
    const insertResult = await query(
      `INSERT INTO avatar_owned_items (student_id, item_id, purchased_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [studentId, itemId]
    );

    // Deduct points
    await query(
      `UPDATE student_rewards
       SET total_points = total_points - $1
       WHERE student_id = $2`,
      [cost, studentId]
    );

    // Log transaction
    await query(
      `INSERT INTO reward_transactions (student_id, type, amount, description)
       VALUES ($1, 'avatar_shop', -$2, $3)`,
      [studentId, cost, `Purchased avatar item: ${itemId}`]
    );

    return NextResponse.json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error purchasing avatar item:', error);
    return NextResponse.json(
      { error: 'Failed to purchase item' },
      { status: 500 }
    );
  }
}
