import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role') || null;
    const search = searchParams.get('search') || null;
    const section = searchParams.get('section') || null;

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (role && role !== 'all') {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (section && section !== 'all') {
      whereConditions.push(`class_name = $${paramIndex}`);
      queryParams.push(section);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(
        `(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR lrn ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get users
    const usersQuery = `
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        lrn, 
        role, 
        class_name, 
        class_id,
        teacher_id,
        teacher_role,
        created_at 
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);
    
    const usersResult = await query(usersQuery, queryParams);

    const users = usersResult.rows.map(u => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'New User',
      email: u.email,
      lrn: u.lrn,
      role: u.role,
      className: u.class_name,
      class_name: u.class_name,
      class_id: u.class_id,
      classId: u.class_id,
      teacherId: u.teacher_id,
      teacher_id: u.teacher_id,
      teacher_role: u.teacher_role,
      joinDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown',
      status: 'Active',
      plan: u.role === 'TEACHER' ? (u.teacher_role === 'assistant' ? 'Assistant' : 'Adviser') : 'Standard'
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('Admin Fetch Users Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}
