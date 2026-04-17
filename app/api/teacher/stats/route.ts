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
    const students: any[] = [];
    const stats: any[] = [
        { label: 'Total Students', value: '0', icon: '👥', color: 'text-brand-purple' },
        { label: 'Class Average', value: '0%', icon: '📈', color: 'text-emerald-400' },
        { label: 'Login Today', value: '0 Students', icon: '👤', color: 'text-amber-500' },
        { label: 'Total Lessons', value: '0', icon: '📝', color: 'text-brand-sky' },
    ];

    let classes = [
        { 
            id: 'class-all', 
            name: 'All Students', 
            students: 0, 
            progress: 0, 
            nextLesson: 'Lesson Plan Active', 
            color: 'border-brand-sky',
            student_count: 0,
            lesson_count: 0,
            is_archived: false
        }
    ];

    try {
        // Fetch teacher's created classes from database (both active and archived)
        console.log(`Fetching classes for teacher: ${teacherId}`);
        
        const classesRes = await query(`
          SELECT 
              c.id,
              c.name,
              c.teacher_id,
              c.is_archived,
              c.created_at,
              (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id)::INT as student_count,
              (SELECT COUNT(*) FROM bahagi WHERE class_name = c.name)::INT as lesson_count
          FROM classes c
          WHERE c.teacher_id = $1
          ORDER BY c.is_archived ASC, c.created_at DESC
        `, [teacherId]);

        console.log(`Query result for teacher ${teacherId}:`, classesRes.rows?.length || 0, 'classes');

        if (classesRes.rows && classesRes.rows.length > 0) {
          classes = classesRes.rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            student_count: parseInt(row.student_count || '0'),
            lesson_count: parseInt(row.lesson_count || '0'),
            progress: 0,
            is_archived: row.is_archived,
            students: parseInt(row.student_count || '0'),
            nextLesson: 'Lesson Plan Active',
            color: 'border-brand-purple'
          }));
          console.log(`✅ Found ${classes.length} classes for teacher (${classes.filter((c: any) => !c.is_archived).length} active, ${classes.filter((c: any) => c.is_archived).length} archived)`);
        } else {
          console.log('No classes found for this teacher, using default');
          classes = [{
            id: 'class-all', 
            name: 'All Students', 
            students: 0,
            student_count: 0,
            lesson_count: 0,
            progress: 0,
            is_archived: false,
            nextLesson: 'Lesson Plan Active',
            color: 'border-brand-sky'
          }];
        }
    } catch (classError: any) {
        console.error('Error fetching classes from database:', classError.message);
        // If table doesn't exist yet, use default
        classes = [{
          id: 'class-all', 
          name: 'All Students', 
          students: 0,
          student_count: 0,
          lesson_count: 0,
          progress: 0,
          is_archived: false,
          nextLesson: 'Lesson Plan Active',
          color: 'border-brand-sky'
        }];
    }

    try {
        // Try to fetch students assigned to this teacher from database
        const studentsRes = await query(`
          SELECT 
              u.id, 
              u.first_name, 
              u.last_name, 
              u.email,
              u.role,
              u.teacher_id,
              0 as progress,
              NOW() as last_active
          FROM users u
          WHERE u.role = 'USER' AND u.teacher_id = $1
          ORDER BY u.created_at DESC
          LIMIT 50
        `, [teacherId]);

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

            // Update stats based on classes and students
            const totalStudents = processedStudents.length;
            let activeTodayCount = 0;
            let totalScoreSum = 0;
            let totalLessons = 0;
            
            processedStudents.forEach(s => {
               totalScoreSum += s.progress;
               if (s.lastActive.includes('Just now') || s.lastActive.includes('m ago') || s.lastActive.includes('h ago')) {
                   activeTodayCount++;
               }
            });

            // Calculate total lessons from all classes
            totalLessons = classes.reduce((sum, cls) => sum + (cls.lesson_count || 0), 0);

            const classAvg = totalStudents > 0 ? Math.round(totalScoreSum / totalStudents) : 0;
            
            stats[0].value = totalStudents.toString();
            stats[1].value = `${classAvg}%`;
            stats[2].value = `${activeTodayCount} Students`;
            stats[3].value = totalLessons.toString();

            return NextResponse.json({
                success: true,
                data: {
                    stats,
                    students: processedStudents,
                    classes,
                    weeklyChart: Array.from({ length: 7 }, (_, i) => ({ label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i], value: 0 })),
                    monthlyChart: Array.from({ length: 4 }, (_, i) => ({ label: `Week ${i + 1}`, value: 0 })),
                }
            });
        }
    } catch (dbError) {
        console.error('Database error fetching students:', dbError);
        // Return default data on database error
    }

    return NextResponse.json({
        success: true,
        data: {
            stats,
            students,
            classes,
            weeklyChart: Array.from({ length: 7 }, (_, i) => ({ label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i], value: 0 })),
            monthlyChart: Array.from({ length: 4 }, (_, i) => ({ label: `Week ${i + 1}`, value: 0 })),
        }
    });
  } catch (error: any) {
    console.error('Teacher Stats API Error:', error);
    return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch stats',
        data: {
            stats: [],
            students: [],
            classes: [],
            weeklyChart: [],
            monthlyChart: [],
        }
    }, { status: 500 });
  }
}
