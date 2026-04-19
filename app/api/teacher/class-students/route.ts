'use server';

import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/teacher/class-students?classId=123&teacherId=uuid
 * List all students enrolled in a class
 * Only the class teacher can view this
 * 
 * POST /api/teacher/class-students
 * Enroll a student in a class
 * Body: { classId, studentId, teacherId }
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');
        const teacherId = searchParams.get('teacherId');

        console.log('[class-students GET] Received params:', { classId, teacherId });

        if (!classId || !teacherId) {
            return NextResponse.json(
                { success: false, error: 'classId and teacherId parameters required' },
                { status: 400 }
            );
        }

        // Verify teacher owns this class
        const classCheck = await query(
            `SELECT id, teacher_id, name FROM classes WHERE id = $1 AND teacher_id = $2`,
            [classId, teacherId]
        );

        console.log('[class-students GET] Class check result:', classCheck.rows);

        if (!classCheck.rows.length) {
            return NextResponse.json(
                { success: false, error: 'Class not found or you do not own this class' },
                { status: 403 }
            );
        }

        // Get students assigned to this class (uses users.class_id as source of truth)
        const students = await query(
            `SELECT
                u.id,
                u.first_name as "firstName",
                u.last_name as "lastName",
                u.email,
                u.created_at as "enrolledAt"
            FROM users u
            WHERE u.class_id = $1
              AND u.role = 'USER'
            ORDER BY u.first_name, u.last_name`,
            [classId]
        );

        console.log('[class-students GET] Students query result:', students.rows);
        console.log('[class-students GET] Total students found:', students.rows.length);

        return NextResponse.json({
            success: true,
            data: {
                classId: classId,
                className: classCheck.rows[0].name,
                totalEnrolled: students.rows.length,
                students: students.rows
            }
        });
    } catch (error) {
        console.error('Get class students error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch enrolled students' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { classId, studentId, teacherId } = body;

        if (!classId || !studentId || !teacherId) {
            return NextResponse.json(
                { success: false, error: 'classId, studentId, and teacherId required' },
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

        // Verify student exists and is actually a student
        const studentCheck = await query(
            `SELECT id, role FROM users WHERE id = $1`,
            [studentId]
        );

        if (!studentCheck.rows.length || (studentCheck.rows[0].role !== 'student' && studentCheck.rows[0].role !== 'USER')) {
            return NextResponse.json(
                { success: false, error: 'Invalid student' },
                { status: 400 }
            );
        }

        // Check if already enrolled
        const existingEnrollment = await query(
            `SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2`,
            [classId, studentId]
        );

        if (existingEnrollment.rows.length) {
            return NextResponse.json(
                { success: false, error: 'Student is already enrolled in this class' },
                { status: 409 }
            );
        }

        // Enroll the student
        const result = await query(
            `INSERT INTO class_enrollments (class_id, student_id, enrolled_by_teacher_id, enrolled_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             RETURNING id, enrolled_at`,
            [classId, studentId, teacherId]
        );

        return NextResponse.json(
            {
                success: true,
                message: 'Student enrolled successfully',
                data: {
                    enrollment: {
                        id: result.rows[0].id,
                        classId: classId,
                        studentId,
                        enrolledAt: result.rows[0].enrolled_at
                    }
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Enroll student error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to enroll student' },
            { status: 500 }
        );
    }
}
