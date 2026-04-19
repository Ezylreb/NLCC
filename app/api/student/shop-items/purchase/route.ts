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

export async function POST(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");
    const body = await request.json();
    const { itemId, quantity = 1 } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      // Mock purchase response
      return NextResponse.json({
        success: true,
        message: "Purchase successful (mock)",
        coinsSpent: 250,
        remainingCoins: 90,
      });
    }

    // Check if student already owns this item
    const { data: existingPurchase } = await supabase
      .from("student_inventory")
      .select("id")
      .eq("student_id", studentId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You already own this item" },
        { status: 400 }
      );
    }

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from("shop_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Get student current coins
    const { data: userStats, error: statsError } = await supabase
      .from("users")
      .select("coins")
      .eq("id", studentId)
      .single();

    if (statsError || !userStats) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const totalCost = item.price * quantity;

    // Check if student has enough coins
    if (userStats.coins < totalCost) {
      return NextResponse.json(
        {
          error: "Insufficient coins",
          required: totalCost,
          available: userStats.coins,
        },
        { status: 400 }
      );
    }

    // Deduct coins
    const { error: updateError } = await supabase
      .from("users")
      .update({ coins: userStats.coins - totalCost })
      .eq("id", studentId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to process purchase" },
        { status: 500 }
      );
    }

    // Add item to inventory
    const { error: inventoryError } = await supabase
      .from("student_inventory")
      .insert({
        student_id: studentId,
        item_id: itemId,
        quantity: quantity,
        purchased_at: new Date().toISOString(),
      });

    if (inventoryError) {
      // Revert coin deduction
      await supabase
        .from("users")
        .update({ coins: userStats.coins })
        .eq("id", studentId);

      return NextResponse.json(
        { error: "Failed to add item to inventory" },
        { status: 500 }
      );
    }

    // Log the transaction
    const { error: logError } = await supabase
      .from("activity_logs")
      .insert({
        student_id: studentId,
        action: `Purchased ${item.name}`,
        coins_spent: totalCost,
      });

    if (logError) {
      console.error("Error logging transaction:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Purchase successful",
      item,
      coinsSpent: totalCost,
      remainingCoins: userStats.coins - totalCost,
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
