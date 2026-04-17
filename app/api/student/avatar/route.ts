import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request | NextRequest) {
  try {
    // Support both header and query parameter
    let studentId: string | null = null;
    
    if (request instanceof NextRequest) {
      studentId = request.headers.get('x-student-id') || 
                  request.nextUrl.searchParams.get('studentId');
    } else {
      const url = new URL(request.url);
      studentId = url.searchParams.get('studentId');
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get or create avatar
    let result = await query(
      'SELECT * FROM avatar_customization WHERE student_id = $1',
      [studentId]
    );

    if (result.rows.length === 0) {
      // Create default avatar
      result = await query(
        `INSERT INTO avatar_customization (student_id)
         VALUES ($1)
         RETURNING *`,
        [studentId]
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let studentId = request.headers.get('x-student-id');
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    const avatarData = await request.json();
    
    if (!avatarData || Object.keys(avatarData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    // Build dynamic UPDATE query
    const updateFields = Object.keys(avatarData)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');

    const values = [
      ...Object.values(avatarData),
      studentId
    ];

    const updateQuery = `
      UPDATE avatar_customization
      SET ${updateFields}, updated_at = NOW()
      WHERE student_id = $${values.length}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      // If no rows updated, try to create a new one
      const insertResult = await query(
        `INSERT INTO avatar_customization (student_id, body, hair, outfit, accessory, emotion)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [studentId, avatarData.body, avatarData.hair, avatarData.outfit, avatarData.accessory, avatarData.emotion]
      );
      return NextResponse.json({ success: true, data: insertResult.rows[0] });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { studentId, ...avatarData } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    const updates = Object.keys(avatarData)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');

    const values = [
      ...Object.values(avatarData),
      studentId
    ];

    const query_str = `
      UPDATE avatar_customization
      SET ${updates}, updated_at = NOW()
      WHERE student_id = $${values.length}
      RETURNING *
    `;

    const result = await query(query_str, values);

    if (result.rows.length === 0) {
      // Create new avatar customization
      const insertResult = await query(
        `INSERT INTO avatar_customization (student_id, head_type, head_color, eyes_type, mouth_type, body_color, clothing_type, clothing_color, hair_type, hair_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [studentId, avatarData.head_type, avatarData.head_color, avatarData.eyes_type, avatarData.mouth_type, avatarData.body_color, avatarData.clothing_type, avatarData.clothing_color, avatarData.hair_type, avatarData.hair_color]
      );
      return NextResponse.json(insertResult.rows[0]);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}
