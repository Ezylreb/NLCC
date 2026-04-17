import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Get counts (wrap in try to prevent total failure)
    let totalStudents = 0;
    let totalTeachers = 0;
    try {
        const totalStudentsRes = await query("SELECT COUNT(*) FROM users WHERE role ILIKE 'USER'");
        const totalTeachersRes = await query("SELECT COUNT(*) FROM users WHERE role ILIKE 'TEACHER'");
        totalStudents = parseInt(totalStudentsRes.rows[0].count);
        totalTeachers = parseInt(totalTeachersRes.rows[0].count);
    } catch (e) {
        console.error('Counts query error:', e);
    }

    // 2. Get Recent Activities
    let activities: any[] = [];
    try {
        const recentActivityRes = await query(`
            SELECT action as log, type, created_at 
            FROM activity_logs 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        function getRelativeTime(date: Date) {
          const diff = (new Date().getTime() - date.getTime()) / 1000;
          if (diff < 60) return 'Just now';
          if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
          if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
          return date.toLocaleDateString();
        }

        activities = recentActivityRes.rows.map(a => ({
          log: a.log,
          time: getRelativeTime(new Date(a.created_at)),
          type: a.type
        }));
    } catch (e) {
        console.error('Activities query error:', e);
    }

    // 3. Get Lessons (Filter by className if provided)
    let lessons: any[] = [];
    try {
        const { searchParams } = new URL(request.url);
        const className = searchParams.get('className');
        
        let lessonsQuery = `SELECT * FROM lessons WHERE is_archived IS NOT TRUE`;
        let lessonsParams: any[] = [];
        
        if (className && className !== 'all') {
            lessonsQuery += ` AND (class_name = $1 OR class_name = 'General' OR class_name IS NULL OR class_name = '')`;
            lessonsParams.push(className);
        }
        
        lessonsQuery += ` ORDER BY created_at DESC`;
        
        const lessonsRes = await query(lessonsQuery, lessonsParams);
        lessons = lessonsRes.rows.map(l => ({
          id: l.id,
          title: l.title,
          category: l.category,
          students: l.students_count,
          rating: l.rating,
          status: l.status,
          icon: l.icon,
          color: l.color,
          description: l.description,
          className: l.class_name,
          class_name: l.class_name,
          teacherId: l.teacher_id
        }));
    } catch (e) {
        console.error('Lessons query error:', e);
    }
    
    // 4. Get Recent Users (Students, Teachers, and Admins)
    let users: any[] = [];
    try {
        const recentUsersRes = await query(`
          SELECT id, first_name, last_name, email, lrn, role, class_name, created_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT 100
        `);
        users = recentUsersRes.rows.map(u => ({
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'New User',
            email: u.email,
            lrn: u.lrn,
            role: u.role,
            className: u.class_name,
            class_name: u.class_name,
            joinDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown',
            status: 'Active',
            plan: u.role === 'TEACHER' ? 'Faculty' : 'Free'
        }));
    } catch (e) {
        console.error('Users list query error:', e);
    }
    
    // 5. Active Today
    let activeToday = 0;
    try {
        const activeTodayRes = await query(`
          SELECT COUNT(DISTINCT user_id) 
          FROM activity_logs 
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        `);
        activeToday = parseInt(activeTodayRes.rows[0].count);
    } catch (e) {
        console.error('Active today query error:', e);
    }

    const stats = [
        { label: 'Total Students', value: totalStudents, icon: '👥', trend: 'Live', color: 'text-brand-purple' },
        { label: 'Total Teachers', value: totalTeachers, icon: '👨‍🏫', trend: 'Live', color: 'text-brand-sky' },
        { label: 'Active Today', value: activeToday, icon: '🔥', trend: 'Live', color: 'text-amber-500' },
        { label: 'Lessons Published', value: lessons.length.toString(), icon: '📚', trend: 'Live', color: 'text-green-500' },
    ];

    // 6. Chart Data
    let chartData: any[] = [];
    try {
        const chartDataRes = await query(`
          WITH days AS (
            SELECT generate_series(
              DATE_TRUNC('day', NOW()) - INTERVAL '6 days',
              DATE_TRUNC('day', NOW()),
              '1 day'::interval
            ) as day_date
          )
          SELECT 
            TO_CHAR(d.day_date, 'Dy') as day,
            COUNT(u.id) as count
          FROM days d
          LEFT JOIN users u ON DATE_TRUNC('day', u.created_at) = d.day_date
          GROUP BY d.day_date
          ORDER BY d.day_date ASC
        `);
        chartData = chartDataRes.rows.map(row => ({
          day: row.day,
          value: parseInt(row.count) || 0
        }));
    } catch (e) {
        console.error('Chart data query error:', e);
    }

    return NextResponse.json({
        success: true,
        data: {
          stats,
          activities,
          lessons,
          chartData,
          users
        }
    });
  } catch (error: any) {
    console.error('Admin Stats Global Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
