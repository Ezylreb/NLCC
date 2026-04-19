// import { createClient } from "@supabase/supabase-js";
// import { NextRequest, NextResponse } from "next/server";
// import { supabase } from "@/lib/supabase";

// const supabase = createClient(
//   process.env.SUPABASE_URL as string,
//   process.env.SUPABASE_SERVICE_ROLE_KEY as string // or SUPABASE_ANON_KEY for client-safe usage
// );

// function getSupabaseClient() {
//   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
//   if (!url || !key) {
//     return null;
//   }
  
//   return createClient(url, key);
// }

// export async function GET(request: NextRequest) {
//   try {
//     const studentId = request.headers.get("x-student-id");

//     if (!studentId) {
//       return NextResponse.json(
//         { error: "Student ID is required" },
//         { status: 400 }
//       );
//     }

//     const supabase = getSupabaseClient();
    
//     if (!supabase) {
//       // Return mock missions when Supabase not configured
//       const mockMissions = [
//         {
//           id: 1,
//           student_id: studentId,
//           title: "Taposing ang 3 Leksyon",
//           description: "Kumpletuhin ang 3 bahagi ng araw-araw na leksyon",
//           category: "daily",
//           difficulty: "easy",
//           xp_reward: 250,
//           coin_reward: 50,
//           progress: 2,
//           target: 3,
//           completed: false,
//         },
//         {
//           id: 2,
//           student_id: studentId,
//           title: "Perpektong Marka",
//           description: "Makakuha ng 100% sa isang assessment",
//           category: "challenge",
//           difficulty: "hard",
//           xp_reward: 500,
//           coin_reward: 100,
//           progress: 0,
//           target: 1,
//           completed: false,
//         },
//       ];
//       return NextResponse.json({
//         success: true,
//         data: mockMissions,
//       });
//     }

//     // Get or create missions for student
//     const { data: existingMissions, error: fetchError } = await supabase
//       .from("student_missions")
//       .select("*")
//       .eq("student_id", studentId);

//     if (fetchError) {
//       return NextResponse.json(
//         { error: "Failed to fetch missions" },
//         { status: 500 }
//       );
//     }

//     // If no missions exist, create default ones
//     if (!existingMissions || existingMissions.length === 0) {
//       const defaultMissions = [
//         {
//           student_id: studentId,
//           title: "Lesson Master",
//           description: "Complete 5 lessons today",
//           category: "daily",
//           difficulty: "medium",
//           xp_reward: 250,
//           coin_reward: 50,
//           progress: 0,
//           target: 5,
//           completed: false,
//           expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
//         },
//         {
//           student_id: studentId,
//           title: "Quiz Champion",
//           description: "Pass 3 quizzes with 80% or higher",
//           category: "challenge",
//           difficulty: "hard",
//           xp_reward: 400,
//           coin_reward: 100,
//           progress: 0,
//           target: 3,
//           completed: false,
//           expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//         },
//         {
//           student_id: studentId,
//           title: "Daily Learner",
//           description: "Log in and view a lesson",
//           category: "daily",
//           difficulty: "easy",
//           xp_reward: 100,
//           coin_reward: 20,
//           progress: 0,
//           target: 1,
//           completed: false,
//           expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
//         },
//         {
//           student_id: studentId,
//           title: "Assessment Ace",
//           description: "Complete an assessment",
//           category: "lesson",
//           difficulty: "medium",
//           xp_reward: 300,
//           coin_reward: 75,
//           progress: 0,
//           target: 1,
//           completed: false,
//           expires_at: null,
//         },
//         {
//           student_id: studentId,
//           title: "Social Butterfly",
//           description: "Earn 500 XP total",
//           category: "active",
//           difficulty: "hard",
//           xp_reward: 500,
//           coin_reward: 150,
//           progress: 0,
//           target: 500,
//           completed: false,
//           expires_at: null,
//         },
//       ];

//       const { data: newMissions, error: createError } = await supabase
//         .from("student_missions")
//         .insert(defaultMissions)
//         .select();

//       if (createError) {
//         return NextResponse.json(
//           { error: "Failed to create missions" },
//           { status: 500 }
//         );
//       }

//       return NextResponse.json({
//         success: true,
//         data: newMissions,
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       data: existingMissions,
//     });
//   } catch (error) {
//     console.error("Missions error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const studentId = request.headers.get("x-student-id");
//     const body = await request.json();
//     const { missionId } = body;

//     if (!studentId) {
//       return NextResponse.json(
//         { error: "Student ID is required" },
//         { status: 400 }
//       );
//     }

//     // Mark mission as complete and award XP
//     const { data: mission, error: fetchError } = await supabase
//       .from("student_missions")
//       .select("*")
//       .eq("id", missionId)
//       .eq("student_id", studentId)
//       .single();

//     if (fetchError || !mission) {
//       return NextResponse.json(
//         { error: "Mission not found" },
//         { status: 404 }
//       );
//     }

//     // Update mission status
//     const { data: updated, error: updateError } = await supabase
//       .from("student_missions")
//       .update({ completed: true })
//       .eq("id", missionId)
//       .select();

//     if (updateError) {
//       return NextResponse.json(
//         { error: "Failed to complete mission" },
//         { status: 500 }
//       );
//     }

//     // Log the XP earned
//     const { error: logError } = await supabase
//       .from("activity_logs")
//       .insert({
//         student_id: studentId,
//         action: `Completed mission: ${mission.title}`,
//         xp_earned: mission.xp_reward,
//         coins_earned: mission.coin_reward,
//       });

//     if (logError) {
//       console.error("Error logging activity:", logError);
//     }

//     return NextResponse.json({
//       success: true,
//       data: updated ? updated[0] : mission,
//       xpAwarded: mission.xp_reward,
//       coinsAwarded: mission.coin_reward,
//     });
//   } catch (error) {
//     console.error("Mission completion error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
// app/api/student/missions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // If Supabase env is missing, return mock data
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const mockMissions = [
        {
          id: 1,
          student_id: studentId,
          title: "Taposing ang 3 Leksyon",
          description: "Kumpletuhin ang 3 bahagi ng araw-araw na leksyon",
          category: "daily",
          difficulty: "easy",
          xp_reward: 250,
          coin_reward: 50,
          progress: 2,
          target: 3,
          completed: false,
        },
        {
          id: 2,
          student_id: studentId,
          title: "Perpektong Marka",
          description: "Makakuha ng 100% sa isang assessment",
          category: "challenge",
          difficulty: "hard",
          xp_reward: 500,
          coin_reward: 100,
          progress: 0,
          target: 1,
          completed: false,
        },
      ];

      return NextResponse.json({
        success: true,
        data: mockMissions,
      });
    }

    // Fetch existing missions
    const { data: existingMissions, error: fetchError } = await supabase
      .from("student_missions")
      .select("*")
      .eq("student_id", studentId);

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch missions" },
        { status: 500 }
      );
    }

    // Create default missions if none exist
    if (!existingMissions || existingMissions.length === 0) {
      const defaultMissions = [
        {
          student_id: studentId,
          title: "Lesson Master",
          description: "Complete 5 lessons today",
          category: "daily",
          difficulty: "medium",
          xp_reward: 250,
          coin_reward: 50,
          progress: 0,
          target: 5,
          completed: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          student_id: studentId,
          title: "Quiz Champion",
          description: "Pass 3 quizzes with 80% or higher",
          category: "challenge",
          difficulty: "hard",
          xp_reward: 400,
          coin_reward: 100,
          progress: 0,
          target: 3,
          completed: false,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          student_id: studentId,
          title: "Daily Learner",
          description: "Log in and view a lesson",
          category: "daily",
          difficulty: "easy",
          xp_reward: 100,
          coin_reward: 20,
          progress: 0,
          target: 1,
          completed: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          student_id: studentId,
          title: "Assessment Ace",
          description: "Complete an assessment",
          category: "lesson",
          difficulty: "medium",
          xp_reward: 300,
          coin_reward: 75,
          progress: 0,
          target: 1,
          completed: false,
          expires_at: null,
        },
        {
          student_id: studentId,
          title: "Social Butterfly",
          description: "Earn 500 XP total",
          category: "active",
          difficulty: "hard",
          xp_reward: 500,
          coin_reward: 150,
          progress: 0,
          target: 500,
          completed: false,
          expires_at: null,
        },
      ];

      const { data: newMissions, error: createError } = await supabase
        .from("student_missions")
        .insert(defaultMissions)
        .select();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create missions" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: newMissions,
      });
    }

    return NextResponse.json({
      success: true,
      data: existingMissions,
    });
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
    const { data: mission, error: fetchError } = await supabase
      .from("student_missions")
      .select("*")
      .eq("id", missionId)
      .eq("student_id", studentId)
      .single();

    if (fetchError || !mission) {
      return NextResponse.json(
        { error: "Mission not found" },
        { status: 404 }
      );
    }

    // Mark as complete
    const { data: updated, error: updateError } = await supabase
      .from("student_missions")
      .update({ completed: true })
      .eq("id", missionId)
      .select();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to complete mission" },
        { status: 500 }
      );
    }

    // Log XP
    const { error: logError } = await supabase
      .from("activity_logs")
      .insert({
        student_id: studentId,
        action: `Completed mission: ${mission.title}`,
        xp_earned: mission.xp_reward,
        coins_earned: mission.coin_reward,
      });

    if (logError) {
      console.error("Error logging activity:", logError);
    }

    return NextResponse.json({
      success: true,
      data: updated ? updated[0] : mission,
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