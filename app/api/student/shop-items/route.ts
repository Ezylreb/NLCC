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
    const studentId = request.headers.get("x-student-id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      // Return mock shop items
      const mockItems = [
        {
          id: 1,
          name: "Purple Hair",
          category: "avatar",
          rarity: "common",
          price: 150,
          description: "Gawing purpre ang buhok mo",
        },
        {
          id: 2,
          name: "Cool Sunglasses",
          category: "cosmetic",
          rarity: "uncommon",
          price: 250,
          description: "Magiging mas cool sa mga sunglasses",
        },
        {
          id: 3,
          name: "Dragon Wings",
          category: "cosmetic",
          rarity: "epic",
          price: 500,
          description: "Mga pakpak ng dragon",
        },
      ];
      return NextResponse.json({
        success: true,
        data: mockItems.map((item) => ({ ...item, owned: false })),
      });
    }

    // Get or create shop items
    const { data: existingItems, error: fetchError } = await supabase
      .from("shop_items")
      .select("*");

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch shop items" },
        { status: 500 }
      );
    }

    // If no items exist, create default ones
    if (!existingItems || existingItems.length === 0) {
      const defaultItems = [
        {
          name: "Purple Hair",
          category: "avatar",
          rarity: "common",
          price: 100,
          description: "Make your avatar stand out with purple hair",
          image_url: "/shop-items/purple-hair.png",
        },
        {
          name: "Cool Sunglasses",
          category: "cosmetic",
          rarity: "uncommon",
          price: 250,
          description: "Look cool with these cyber sunglasses",
          image_url: "/shop-items/sunglasses.png",
        },
        {
          name: "Dragon Wings",
          category: "cosmetic",
          rarity: "rare",
          price: 500,
          description: "Legendary dragon wings accessory",
          image_url: "/shop-items/dragon-wings.png",
        },
        {
          name: "Golden Crown",
          category: "accessory",
          rarity: "epic",
          price: 1000,
          description: "Rare golden crown for champions",
          image_url: "/shop-items/golden-crown.png",
        },
        {
          name: "Gamer Outfit",
          category: "avatar",
          rarity: "uncommon",
          price: 300,
          description: "Cool gamer-style outfit",
          image_url: "/shop-items/gamer-outfit.png",
        },
        {
          name: "Pixel Art Background",
          category: "background",
          rarity: "common",
          price: 150,
          description: "Retro pixel art background",
          image_url: "/shop-items/pixel-bg.png",
        },
        {
          name: "Rainbow Aura",
          category: "cosmetic",
          rarity: "epic",
          price: 750,
          description: "Mystical rainbow aura effect",
          image_url: "/shop-items/rainbow-aura.png",
        },
        {
          name: "Power Boost +10%",
          category: "power-up",
          rarity: "uncommon",
          price: 200,
          description: "Temporary 10% XP boost for 1 hour",
          image_url: "/shop-items/power-boost.png",
        },
      ];

      const { data: newItems, error: createError } = await supabase
        .from("shop_items")
        .insert(defaultItems)
        .select();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create shop items" },
          { status: 500 }
        );
      }

      // Get student inventory
      const { data: inventory } = await supabase
        .from("student_inventory")
        .select("item_id")
        .eq("student_id", studentId);

      const ownedIds = inventory?.map((i: any) => i.item_id) || [];

      const itemsWithOwnership = newItems.map((item: any) => ({
        ...item,
        owned: ownedIds.includes(item.id),
      }));

      return NextResponse.json({
        success: true,
        data: itemsWithOwnership,
      });
    }

    // Get student inventory
    const { data: inventory } = await supabase
      .from("student_inventory")
      .select("item_id")
      .eq("student_id", studentId);

    const ownedIds = inventory?.map((i: any) => i.item_id) || [];

    const itemsWithOwnership = existingItems.map((item: any) => ({
      ...item,
      owned: ownedIds.includes(item.id),
    }));

    return NextResponse.json({
      success: true,
      data: itemsWithOwnership,
    });
  } catch (error) {
    console.error("Shop items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
