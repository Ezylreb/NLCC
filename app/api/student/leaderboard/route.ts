import { query } from '@/lib/db';
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const currentStudentResult = await query(
      `SELECT COALESCE(
          NULLIF(TRIM(c.name), ''),
          NULLIF(TRIM(ec.class_name), ''),
          NULLIF(TRIM(u.class_name), '')
        ) AS grade_level
       FROM users u
       LEFT JOIN classes c ON c.id = u.class_id
       LEFT JOIN (
         SELECT ce.student_id, MAX(c2.name) AS class_name
         FROM class_enrollments ce
         LEFT JOIN classes c2 ON c2.id = ce.class_id
         GROUP BY ce.student_id
       ) ec ON ec.student_id = u.id
       WHERE u.id = $1 AND (u.role = 'student' OR u.role = 'USER')
       LIMIT 1`,
      [studentId]
    );

    const currentGradeLevel = currentStudentResult.rows[0]?.grade_level;

    if (!currentGradeLevel) {
      return NextResponse.json(
        { error: "Current student's grade level was not found" },
        { status: 404 }
      );
    }

    const leaderboardResult = await query(
      `WITH enrolled_classes AS (
         SELECT ce.student_id, MAX(c2.name) AS class_name
         FROM class_enrollments ce
         LEFT JOIN classes c2 ON c2.id = ce.class_id
         GROUP BY ce.student_id
       ),
       open_bahagi_yunits AS (
         SELECT
           b.teacher_id,
           b.class_name,
           COUNT(l.id) AS total_yunits
         FROM bahagi b
         LEFT JOIN lesson l ON l.bahagi_id = b.id
         WHERE b.is_open = true
         GROUP BY b.teacher_id, b.class_name
       ),
       student_scope AS (
         SELECT
           s.id,
           s.teacher_id,
           COALESCE(NULLIF(TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))), ''), NULLIF(TRIM(s.email), ''), 'Student') AS name,
           COALESCE(
             NULLIF(TRIM(c.name), ''),
             NULLIF(TRIM(ec.class_name), ''),
             NULLIF(TRIM(s.class_name), '')
           ) AS grade_level
         FROM users s
         LEFT JOIN classes c ON c.id = s.class_id
         LEFT JOIN enrolled_classes ec ON ec.student_id = s.id
         WHERE (s.role = 'student' OR s.role = 'USER')
       )
       SELECT
         ss.id,
         ss.name,
         ss.grade_level,
         COALESCE(oby.total_yunits, 0) * 10 AS total_xp
       FROM student_scope ss
       LEFT JOIN open_bahagi_yunits oby
         ON oby.teacher_id = ss.teacher_id
        AND oby.class_name = ss.grade_level
       WHERE ss.grade_level = $1
       ORDER BY total_xp DESC, ss.name ASC`,
      [currentGradeLevel]
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
      gradeLevel: currentGradeLevel,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
