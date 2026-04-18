'use server';

import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/teacher/available-students?classId=123&teacherId=uuid
 * Get all students not yet enrolled in this class
 * Returns: Array of {id, firstName, lastName, email, level}
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');
        const teacherId = searchParams.get('teacherId');

        if (!classId || !teacherId) {
            return NextResponse.json(
                { success: false, error: 'classId and teacherId parameters required' },
                { status: 400 }
            );
        }

        // Verify teacher owns this class
        const classCheck = await query(
            `SELECT id, teacher_id FROM classes WHERE id = $1 AND teacher_id = $2`,
            [classId, teacherId]
        );

        if (!classCheck.rows.length) {
            return NextResponse.json(
                { success: false, error: 'You do not own this class' },
                { status: 403 }
            );
        }

        // Get all students that are:
        // 1. Assigned to this teacher (teacher_id matches)
        // 2. Not yet enrolled in this specific class (neither via enrollment nor direct assignment)
        const students = await query(
            `SELECT 
                u.id,
                u.first_name as "firstName",
                u.last_name as "lastName",
                u.email
            FROM users u
            WHERE (u.role = 'student' OR u.role = 'USER')
            AND u.teacher_id = $2
            AND u.class_id IS NULL  -- Not directly assigned to any class
            AND u.id NOT IN (
                SELECT student_id FROM class_enrollments WHERE class_id = $1
            )
            ORDER BY u.first_name, u.last_name`,
            [classId, teacherId]
        );

        return NextResponse.json({
            success: true,
            data: {
                classId: classId,
                totalAvailable: students.rows.length,
                students: students.rows
            }
        });
    } catch (error) {
        console.error('Get available students error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch available students' },
            { status: 500 }
        );
    }
}
