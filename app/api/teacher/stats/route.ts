import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    // Default empty data
    const students = [];
    const stats = [
        { label: 'Total Students', value: '0', icon: '👥', color: 'text-brand-purple' },
        { label: 'Class Average', value: '0%', icon: '📈', color: 'text-emerald-400' },
        { label: 'Login Today', value: '0 Students', icon: '👤', color: 'text-amber-500' },
        { label: 'Total Lessons', value: '0', icon: '📝', color: 'text-brand-sky' },
    ];

    const classes = [
        { 
            id: 'class-all', 
            name: 'All Students', 
            students: 0, 
            progress: 0, 
            nextLesson: 'Lesson Plan Active', 
            color: 'border-brand-sky' 
        }
    ];

    try {
        // Try to fetch real students from database
        const studentsRes = await query(`
          SELECT 
              u.id, 
              u.first_name, 
              u.last_name, 
              u.email,
              u.role,
              0 as progress,
              NOW() as last_active
          FROM users u
          WHERE u.role = 'USER'
          ORDER BY u.created_at DESC
          LIMIT 50
        `);

        if (studentsRes.rows && studentsRes.rows.length > 0) {
            // Process students
            const processedStudents = studentsRes.rows.map(s => {
                let status = 'Offline';
                let lastActiveStr = 'Never';
                if (s.last_active) {
                    const diffMinutes = Math.floor((Date.now() - new Date(s.last_active).getTime()) / 60000);
                    if (diffMinutes < 15) status = 'Online';
                    else if (diffMinutes < 60) status = 'Idle';
                    
                    if (diffMinutes === 0) lastActiveStr = 'Just now';
                    else if (diffMinutes < 60) lastActiveStr = `${diffMinutes}m ago`;
                    else if (diffMinutes < 1440) lastActiveStr = `${Math.floor(diffMinutes/60)}h ago`;
                    else lastActiveStr = `${Math.floor(diffMinutes/1440)}d ago`;
                }
                
                return {
                    id: s.id,
                    name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email?.split('@')[0] || 'Unknown Student',
                    progress: Math.min(100, Math.round(Number(s.progress || 0))),
                    lastActive: lastActiveStr,
                    status,
                    email: s.email,
                    role: s.role
                };
            });

            // Update stats
            const totalStudents = processedStudents.length;
            let activeTodayCount = 0;
            let totalScoreSum = 0;
            
            processedStudents.forEach(s => {
               totalScoreSum += s.progress;
               if (s.lastActive.includes('Just now') || s.lastActive.includes('m ago') || s.lastActive.includes('h ago')) {
                   activeTodayCount++;
               }
            });

            const classAvg = totalStudents > 0 ? Math.round(totalScoreSum / totalStudents) : 0;
            
            stats[0].value = totalStudents.toString();
            stats[1].value = `${classAvg}%`;
            stats[2].value = `${activeTodayCount} Students`;
            
            classes[0].students = totalStudents;
            classes[0].progress = classAvg;

            return NextResponse.json({
                stats,
                students: processedStudents,
                classes,
                weeklyChart: Array.from({ length: 7 }, (_, i) => ({ label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i], value: 0 })),
                monthlyChart: Array.from({ length: 4 }, (_, i) => ({ label: `Week ${i + 1}`, value: 0 })),
            });
        }
    } catch (dbError) {
        console.error('Database error fetching students:', dbError);
        // Return default data on database error
    }

    return NextResponse.json({
        stats,
        students,
        classes,
        weeklyChart: Array.from({ length: 7 }, (_, i) => ({ label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i], value: 0 })),
        monthlyChart: Array.from({ length: 4 }, (_, i) => ({ label: `Week ${i + 1}`, value: 0 })),
    });
  } catch (error: any) {
    console.error('Teacher Stats API Error:', error);
    return NextResponse.json({ 
        stats: [],
        students: [],
        classes: [],
        weeklyChart: [],
        monthlyChart: [],
        error: 'Failed to fetch stats'
    }, { status: 500 });
  }
}
