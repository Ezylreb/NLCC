import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bahaginitId = searchParams.get('bahaginitId');

    if (!bahaginitId) {
      return NextResponse.json({ error: 'Bahagi ID required' }, { status: 400 });
    }

    const result = await query(
      `SELECT * FROM yunits 
       WHERE bahagi_id = $1 
       ORDER BY display_order ASC`,
      [bahaginitId]
    );

    return NextResponse.json({ yunits: result.rows });
  } catch (error) {
    console.error('Error fetching yunits:', error);
    return NextResponse.json({ error: 'Failed to fetch yunits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { bahaginitId, title, subtitle, description, contentGuide } = await request.json();

    if (!bahaginitId || !title) {
      return NextResponse.json({ error: 'Bahagi ID and title required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO yunits (bahagi_id, title, subtitle, description, content_guide, display_order)
       VALUES ($1, $2, $3, $4, $5, 
         (SELECT COALESCE(MAX(display_order), 0) + 1 FROM yunits WHERE bahagi_id = $1))
       RETURNING *`,
      [bahaginitId, title, subtitle || '', description || '', contentGuide || '']
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating yunit:', error);
    return NextResponse.json({ error: 'Failed to create yunit' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, subtitle, description, contentGuide } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Yunit ID required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE yunits 
       SET title = $1, subtitle = $2, description = $3, content_guide = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, subtitle || '', description || '', contentGuide || '', id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Yunit not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating yunit:', error);
    return NextResponse.json({ error: 'Failed to update yunit' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Yunit ID required' }, { status: 400 });
    }

    await query('DELETE FROM yunits WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting yunit:', error);
    return NextResponse.json({ error: 'Failed to delete yunit' }, { status: 500 });
  }
}
