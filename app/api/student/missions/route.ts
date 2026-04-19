import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Ensure student_missions table exists
    await query(`
      CREATE TABLE IF NOT EXISTS student_missions (
        id SERIAL PRIMARY KEY,
        student_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'daily',
        difficulty VARCHAR(20) DEFAULT 'easy',
        xp_reward INT DEFAULT 0,
        coin_reward INT DEFAULT 0,
        progress INT DEFAULT 0,
        target INT DEFAULT 1,
        completed BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Fetch existing missions for this student
    const existingMissions = await query(
      `SELECT * FROM student_missions WHERE student_id = $1 ORDER BY created_at ASC`,
      [studentId]
    );

    // If missions exist, return them with updated progress
    if (existingMissions.rows.length > 0) {
      const missions = await updateMissionProgress(studentId, existingMissions.rows);
      return NextResponse.json({ success: true, data: missions });
    }

    // Create default missions for this student
    const defaultMissions = [
      {
        title: "Taposing ang 3 Leksyon",
        description: "Kumpletuhin ang 3 bahagi ng araw-araw na leksyon",
        category: "daily",
        difficulty: "easy",
        xp_reward: 250,
        coin_reward: 50,
        target: 3,
      },
      {
        title: "Perpektong Marka",
        description: "Makakuha ng 100% sa isang assessment",
        category: "challenge",
        difficulty: "hard",
        xp_reward: 500,
        coin_reward: 100,
        target: 1,
      },
      {
        title: "Araw-araw na Mag-aral",
        description: "Mag-log in at tingnan ang isang leksyon",
        category: "daily",
        difficulty: "easy",
        xp_reward: 100,
        coin_reward: 20,
        target: 1,
      },
      {
        title: "Assessment Ace",
        description: "Kumpletuhin ang isang assessment",
        category: "lesson",
        difficulty: "medium",
        xp_reward: 300,
        coin_reward: 75,
        target: 1,
      },
      {
        title: "XP Hunter",
        description: "Makakuha ng 500 XP kabuuan",
        category: "active",
        difficulty: "hard",
        xp_reward: 500,
        coin_reward: 150,
        target: 500,
      },
    ];

    const insertedMissions = [];
    for (const mission of defaultMissions) {
      const result = await query(
        `INSERT INTO student_missions (student_id, title, description, category, difficulty, xp_reward, coin_reward, progress, target, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, false)
         RETURNING *`,
        [studentId, mission.title, mission.description, mission.category, mission.difficulty, mission.xp_reward, mission.coin_reward, mission.target]
      );
      insertedMissions.push(result.rows[0]);
    }

    // Update progress based on actual activity
    const missions = await updateMissionProgress(studentId, insertedMissions);

    return NextResponse.json({ success: true, data: missions });
  } catch (error) {
    console.error("Missions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");
    const body = await request.json();
    const { missionId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!missionId) {
      return NextResponse.json(
        { error: "Mission ID is required" },
        { status: 400 }
      );
    }

    // Fetch mission
    const missionResult = await query(
      `SELECT * FROM student_missions WHERE id = $1 AND student_id = $2`,
      [missionId, studentId]
    );

    if (missionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Mission not found" },
        { status: 404 }
      );
    }

    const mission = missionResult.rows[0];

    // Mark as complete
    await query(
      `UPDATE student_missions SET completed = true WHERE id = $1`,
      [missionId]
    );

    // Award XP and coins to the student
    try {
      await query(
        `UPDATE users SET xp = COALESCE(xp, 0) + $1, coins = COALESCE(coins, 0) + $2 WHERE id = $3`,
        [mission.xp_reward, mission.coin_reward, studentId]
      );
    } catch (err) {
      console.warn("Could not update user XP/coins:", err);
    }

    return NextResponse.json({
      success: true,
      data: { ...mission, completed: true },
      xpAwarded: mission.xp_reward,
      coinsAwarded: mission.coin_reward,
    });
  } catch (error) {
    console.error("Mission completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update mission progress based on actual student activity in the database
 */
async function updateMissionProgress(studentId: string, missions: any[]) {
  try {
    // Get lesson completion count
    const lessonCount = await query(
      `SELECT COUNT(*) as count FROM lesson_progress WHERE student_id = $1 AND completed = true`,
      [studentId]
    ).catch(() => ({ rows: [{ count: 0 }] }));

    // Get assessment completion count
    const assessmentCount = await query(
      `SELECT COUNT(*) as count FROM yunit_answer WHERE student_id = $1`,
      [studentId]
    ).catch(() => ({ rows: [{ count: 0 }] }));

    // Get total XP
    const xpResult = await query(
      `SELECT COALESCE(xp, 0) as xp FROM users WHERE id = $1`,
      [studentId]
    ).catch(() => ({ rows: [{ xp: 0 }] }));

    const completedLessons = parseInt(lessonCount.rows[0]?.count || 0);
    const completedAssessments = parseInt(assessmentCount.rows[0]?.count || 0);
    const totalXp = parseInt(xpResult.rows[0]?.xp || 0);

    for (const mission of missions) {
      let newProgress = mission.progress;

      if (mission.category === 'daily' && mission.title.includes('Leksyon')) {
        newProgress = Math.min(completedLessons, mission.target);
      } else if (mission.category === 'daily' && mission.title.includes('Mag-aral')) {
        newProgress = 1; // Logged in = progress 1
      } else if (mission.category === 'lesson' || mission.title.includes('Assessment')) {
        newProgress = Math.min(completedAssessments, mission.target);
      } else if (mission.category === 'active' && mission.title.includes('XP')) {
        newProgress = Math.min(totalXp, mission.target);
      }

      const isCompleted = newProgress >= mission.target;

      if (newProgress !== mission.progress || isCompleted !== mission.completed) {
        await query(
          `UPDATE student_missions SET progress = $1, completed = $2 WHERE id = $3`,
          [newProgress, isCompleted, mission.id]
        ).catch(() => {});
      }

      mission.progress = newProgress;
      mission.completed = isCompleted;
    }
  } catch (err) {
    console.warn("Could not update mission progress:", err);
  }

  return missions;
}
