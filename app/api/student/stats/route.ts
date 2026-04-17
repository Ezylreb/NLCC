import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

const MOCK_STATS = {
  studentId: "unknown",
  xp: 0,
  coins: 340,
  totalXpEarned: 0,
  totalCoinsEarned: 0,
  level: 1,
};

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: { ...MOCK_STATS, studentId },
      });
    }

    // Get student stats from users table
    const { data: userStats, error: userError } = await supabase
      .from("users")
      .select("id, coins, xp")
      .eq("id", studentId)
      .single();

    if (userError || !userStats) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get total XP from activity logs
    const { data: activities, error: activityError } = await supabase
      .from("activity_logs")
      .select("xp_earned")
      .eq("student_id", studentId);

    let totalXp = userStats.xp || 0;
    if (activities && activities.length > 0) {
      const earnedXp = activities.reduce(
        (sum: number, log: any) => sum + (log.xp_earned || 0),
        0
      );
      totalXp += earnedXp;
    }

    // Get total coins earned
    const { data: coinData, error: coinError } = await supabase
      .from("activity_logs")
      .select("coins_earned")
      .eq("student_id", studentId);

    let totalCoinsEarned = 0;
    if (coinData && coinData.length > 0) {
      totalCoinsEarned = coinData.reduce(
        (sum: number, log: any) => sum + (log.coins_earned || 0),
        0
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        xp: totalXp,
        coins: userStats.coins || 340,
        totalXpEarned: totalXp,
        totalCoinsEarned,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
