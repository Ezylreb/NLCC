import { query } from '@/lib/db';
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");
    const requestedClassId = request.nextUrl.searchParams.get("classId")?.trim() || "";

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const currentStudentResult = await query(
      `WITH student_enrollment AS (
         SELECT ce.class_id
         FROM class_enrollments ce
         WHERE ce.student_id = $1
           AND ($2 = '' OR ce.class_id::text = $2)
         ORDER BY ce.created_at DESC NULLS LAST, ce.class_id DESC
         LIMIT 1
       )
       SELECT
         COALESCE(se.class_id, u.class_id) AS class_id,
         COALESCE(c.teacher_id, u.teacher_id) AS teacher_id,
         COALESCE(
           NULLIF(TRIM(c.name), ''),
           NULLIF(TRIM(u.class_name), '')
         ) AS class_name
       FROM users u
       LEFT JOIN student_enrollment se ON TRUE
       LEFT JOIN classes c ON c.id = COALESCE(se.class_id, u.class_id)
       WHERE u.id = $1 AND (u.role = 'student' OR u.role = 'USER')
       LIMIT 1`,
      [studentId, requestedClassId]
    );

    const currentClassId = currentStudentResult.rows[0]?.class_id;
    const currentTeacherId = currentStudentResult.rows[0]?.teacher_id;
    const currentClassName = currentStudentResult.rows[0]?.class_name;

    if (requestedClassId && String(currentClassId || '') !== requestedClassId) {
      return NextResponse.json(
        { error: "You are not enrolled in the requested class" },
        { status: 403 }
      );
    }

    if (!currentClassId) {
      return NextResponse.json(
        { error: "Current student's class was not found" },
        { status: 404 }
      );
    }

    const leaderboardResult = await query(
      `WITH class_scope AS (
         SELECT c.id
         FROM classes c
         WHERE c.id = $1
           AND ($2 = '' OR c.teacher_id::text = $2)
       )
       SELECT
         s.id,
         COALESCE(
           NULLIF(TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))), ''),
           NULLIF(TRIM(s.email), ''),
           'Student'
         ) AS name,
         COALESCE(s.xp, 0) AS total_xp
       FROM users s
       WHERE (s.role = 'student' OR s.role = 'USER')
         AND EXISTS (SELECT 1 FROM class_scope)
         AND (
           s.class_id = $1
           OR EXISTS (
             SELECT 1
             FROM class_enrollments ce
             WHERE ce.student_id = s.id AND ce.class_id = $1
           )
         )
       ORDER BY total_xp DESC, name ASC`,
      [currentClassId, String(currentTeacherId || '')]
    );

    const students = leaderboardResult.rows;
    const leaderboard = students
      .sort((a: any, b: any) => {
        if (b.total_xp !== a.total_xp) {
          return b.total_xp - a.total_xp;
        }

        return String(a.name || '').localeCompare(String(b.name || ''));
      })
      .map((student: any, index: number) => {
      const totalXp = Number(student.total_xp) || 0;

      let badge = "";
      if (index === 0) badge = "🥇";
      else if (index === 1) badge = "🥈";
      else if (index === 2) badge = "🥉";

      return {
        rank: index + 1,
        id: student.id,
        name: student.name || "Student",
        xp: totalXp,
        badge,
        isCurrentStudent: student.id === studentId,
      };
    });

    return NextResponse.json({
      success: true,
      data: leaderboard,
      gradeLevel: currentClassName,
      className: currentClassName,
      classId: currentClassId,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
