'use server';

import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/teacher/search-students?q=query&classId=123&teacherId=uuid
 * Search for students by email, first name, or last name
 * Returns: Array of {id, firstName, lastName, email, isEnrolled}
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q')?.toLowerCase() || '';
        const classId = searchParams.get('classId');
        const teacherId = searchParams.get('teacherId');

        if (!q || q.length < 2) {
            return NextResponse.json({ results: [] });
        }

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

        // Search for students (exclude staff and admins, exclude already enrolled)
        const searchResults = await query(
            `SELECT 
                u.id,
                u.first_name as "firstName",
                u.last_name as "lastName",
                u.email,
                CASE WHEN ce.id IS NOT NULL THEN true ELSE false END as "isEnrolled"
            FROM users u
            LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.class_id = $1
            WHERE u.role = 'student'
            AND (
                LOWER(u.email) LIKE $2
                OR LOWER(u.first_name) LIKE $2
                OR LOWER(u.last_name) LIKE $2
            )
            AND ce.id IS NULL
            ORDER BY u.first_name, u.last_name
            LIMIT 20`,
            [classId, `%${q}%`]
        );

        return NextResponse.json({
            results: searchResults.rows
        });
    } catch (error) {
        console.error('Search students error:', error);
        return NextResponse.json(
            { error: 'Failed to search students' },
            { status: 500 }
        );
    }
}
