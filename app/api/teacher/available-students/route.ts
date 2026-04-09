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
                { error: 'classId and teacherId parameters required' },
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
                { error: 'You do not own this class' },
                { status: 403 }
            );
        }

        // Get all students that are not yet enrolled in this class
        const students = await query(
            `SELECT 
                u.id,
                u.first_name as "firstName",
                u.last_name as "lastName",
                u.email,
                COALESCE(u.level, 'kinder1') as "level"
            FROM users u
            WHERE u.role = 'student'
            AND u.id NOT IN (
                SELECT student_id FROM class_enrollments WHERE class_id = $1
            )
            ORDER BY u.first_name, u.last_name`,
            [classId]
        );

        return NextResponse.json({
            classId: parseInt(classId as string),
            totalAvailable: students.rows.length,
            students: students.rows
        });
    } catch (error) {
        console.error('Get available students error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch available students' },
            { status: 500 }
        );
    }
}
