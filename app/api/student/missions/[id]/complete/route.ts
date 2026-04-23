import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Complete a specific mission by ID
 * POST /api/student/missions/{id}/complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = request.headers.get("x-student-id");
    const missionId = params.id;

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

    // Fetch mission to verify ownership and get rewards
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

    if (mission.completed) {
      return NextResponse.json(
        {
          success: false,
          error: "Mission already completed",
          data: mission,
          alreadyCompleted: true,
        },
        { status: 400 }
      );
    }

    // Mark mission as complete
    const updateResult = await query(
      `UPDATE student_missions 
       SET completed = true, progress = target 
       WHERE id = $1 
       RETURNING *`,
      [missionId]
    );

    const completedMission = updateResult.rows[0];

    // Award XP and coins to student
    try {
      const userUpdateResult = await query(
        `UPDATE users 
         SET xp = COALESCE(xp, 0) + $1, 
             coins = COALESCE(coins, 0) + $2 
         WHERE id = $3
         RETURNING xp, coins`,
        [mission.xp_reward, mission.coin_reward, studentId]
      );

      // Log mission completion in activity logs
      await query(
        `INSERT INTO activity_logs (user_id, action, description, metadata)
         VALUES ($1, $2, $3, $4)`,
        [
          studentId,
          "mission_completed",
          `Completed mission: ${mission.title}`,
          JSON.stringify({
            mission_id: missionId,
            xp_earned: mission.xp_reward,
            coins_earned: mission.coin_reward,
          }),
        ]
      ).catch(() => {
        // Silently fail if activity log table doesn't exist
      });

      return NextResponse.json({
        success: true,
        data: completedMission,
        rewards: {
          xpAwarded: mission.xp_reward,
          coinsAwarded: mission.coin_reward,
        },
        message: `Mission completed! Earned ${mission.xp_reward} XP and ${mission.coin_reward} coins.`,
      });
    } catch (err) {
      console.warn("Could not update user rewards:", err);
      return NextResponse.json(
        {
          success: false,
          error: "Mission marked complete but rewards not applied. Please contact support.",
          data: completedMission,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Mission completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Reset a mission (for testing or admin purposes)
 * DELETE /api/student/missions/{id}/complete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = request.headers.get("x-student-id");
    const missionId = params.id;

    if (!studentId || !missionId) {
      return NextResponse.json(
        { error: "Student ID and Mission ID are required" },
        { status: 400 }
      );
    }

    const resetResult = await query(
      `UPDATE student_missions 
       SET completed = false, progress = 0 
       WHERE id = $1 AND student_id = $2
       RETURNING *`,
      [missionId, studentId]
    );

    if (resetResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Mission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resetResult.rows[0],
      message: "Mission reset successfully",
    });
  } catch (error) {
    console.error("Mission reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
