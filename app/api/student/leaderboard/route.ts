import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "all";
    const studentId = request.headers.get("x-student-id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      const mockLeaderboard = [
        { rank: 1, name: 'Maria Santos', xp: 4850, badge: '🥇', id: 'mock-1' },
        { rank: 2, name: 'Juan dela Cruz', xp: 4620, badge: '🥈', id: 'mock-2' },
        { rank: 3, name: 'Anna Reyes', xp: 4395, badge: '🥉', id: 'mock-3' },
      ];
      return NextResponse.json({
        success: true,
        data: mockLeaderboard,
        timeframe,
      });
    }
    
    let query = supabase
      .from("users")
      .select(
        "id, full_name, avatar_url, activity_logs!inner(xp_earned, created_at)"
      )
      .eq("role", "student")
      .order("xp_earned", { ascending: false });

    // Filter by timeframe
    if (timeframe !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (timeframe === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }

      query = query.gte("activity_logs.created_at", startDate.toISOString());
    }

    const { data: leaderboardData, error } = await query.limit(50);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    // Transform data to include rankings and aggregated XP
    const leaderboard = leaderboardData.map((student: any, index: number) => {
      const totalXp = student.activity_logs.reduce(
        (sum: number, log: any) => sum + (log.xp_earned || 0),
        0
      );

      let badge = "";
      if (index === 0) badge = "🥇";
      else if (index === 1) badge = "🥈";
      else if (index === 2) badge = "🥉";

      return {
        rank: index + 1,
        id: student.id,
        name: student.full_name || "Student",
        xp: totalXp,
        badge,
        avatarUrl: student.avatar_url,
        isCurrentStudent: student.id === studentId,
      };
    });

    return NextResponse.json({
      success: true,
      data: leaderboard,
      timeframe,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
