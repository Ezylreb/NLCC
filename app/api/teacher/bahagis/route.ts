import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 });
    }

    const result = await query(
      `SELECT * FROM bahagis 
       WHERE teacher_id = $1 AND is_archived = false 
       ORDER BY display_order ASC`,
      [teacherId]
    );

    return NextResponse.json({ bahagis: result.rows });
  } catch (error) {
    console.error('Error fetching bahagis:', error);
    return NextResponse.json({ error: 'Failed to fetch bahagis' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { teacherId, title, description, imageUrl } = await request.json();

    if (!teacherId || !title) {
      return NextResponse.json({ error: 'Teacher ID and title required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO bahagis (teacher_id, title, description, image_url, display_order, is_open)
       VALUES ($1, $2, $3, $4, 
         (SELECT COALESCE(MAX(display_order), 0) + 1 FROM bahagis WHERE teacher_id = $1),
         false)
       RETURNING *`,
      [teacherId, title, description || '', imageUrl || '']
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bahagi:', error);
    return NextResponse.json({ error: 'Failed to create bahagi' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, description, imageUrl, isOpen } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Bahagi ID required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE bahagis 
       SET title = $1, description = $2, image_url = $3, is_open = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description || '', imageUrl || '', isOpen || false, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Bahagi not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bahagi:', error);
    return NextResponse.json({ error: 'Failed to update bahagi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bahagi ID required' }, { status: 400 });
    }

    await query('UPDATE bahagis SET is_archived = true WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bahagi:', error);
    return NextResponse.json({ error: 'Failed to delete bahagi' }, { status: 500 });
  }
}
