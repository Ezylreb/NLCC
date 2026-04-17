'use server';

import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/teacher/unenroll-student?classId=123&studentId=uuid&teacherId=uuid
 * Unenroll a student from a class
 * Only the class teacher can unenroll
 */

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');
        const studentId = searchParams.get('studentId');
        const teacherId = searchParams.get('teacherId');

        if (!classId || !studentId || !teacherId) {
            return NextResponse.json(
                { success: false, error: 'classId, studentId, and teacherId parameters required' },
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

        // Verify enrollment exists
        const enrollmentCheck = await query(
            `SELECT id FROM class_enrollments 
             WHERE class_id = $1 AND student_id = $2`,
            [classId, studentId]
        );

        if (!enrollmentCheck.rows.length) {
            return NextResponse.json(
                { success: false, error: 'Student is not enrolled in this class' },
                { status: 404 }
            );
        }

        // Delete the enrollment
        await query(
            `DELETE FROM class_enrollments 
             WHERE class_id = $1 AND student_id = $2`,
            [classId, studentId]
        );

        return NextResponse.json({
            success: true,
            message: 'Student unenrolled successfully',
            data: {
                classId: classId,
                studentId
            }
        });
    } catch (error) {
        console.error('Unenroll student error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to unenroll student' },
            { status: 500 }
        );
    }
}
