import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = (page - 1) * limit;

    // 1. Get activities for the current page
    const activitiesRes = await query(`
      SELECT action as log, type, created_at 
      FROM activity_logs 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // 2. Get total count for pagination calculation
    const totalRes = await query('SELECT COUNT(*) FROM activity_logs');
    const totalCount = parseInt(totalRes.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    function getRelativeTime(date: Date) {
      const diff = (new Date().getTime() - date.getTime()) / 1000;
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return date.toLocaleDateString();
    }

    const activities = activitiesRes.rows.map(a => ({
      log: a.log,
      time: getRelativeTime(new Date(a.created_at)),
      type: a.type
    }));

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error: any) {
    console.error('Activities API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
