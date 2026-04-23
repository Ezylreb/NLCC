import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Get student's inventory (owned items)
 * GET /api/student/inventory
 */
export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS student_inventory (
        id BIGSERIAL PRIMARY KEY,
        student_id UUID NOT NULL,
        item_id BIGINT NOT NULL,
        quantity INT DEFAULT 1,
        purchased_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Fetch owned items for this student
    const inventoryResult = await query(
      `SELECT si.*, sii.name, sii.category, sii.rarity, sii.price
       FROM student_inventory si
       LEFT JOIN shop_items sii ON si.item_id = sii.id
       WHERE si.student_id = $1
       ORDER BY si.purchased_at DESC`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      data: inventoryResult.rows || [],
      count: (inventoryResult.rows || []).length,
    });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get item ownership status
 * POST /api/student/inventory/check
 */
export async function POST(request: NextRequest) {
  try {
    const studentId = request.headers.get("x-student-id");
    const body = await request.json();
    const { itemIds } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!itemIds || !Array.isArray(itemIds)) {
      return NextResponse.json(
        { error: "itemIds array is required" },
        { status: 400 }
      );
    }

    // Check which items are owned
    const ownedResult = await query(
      `SELECT DISTINCT item_id FROM student_inventory 
       WHERE student_id = $1 AND item_id = ANY($2)`,
      [studentId, itemIds]
    );

    const ownedIds = ownedResult.rows.map((row: any) => row.item_id);

    return NextResponse.json({
      success: true,
      data: {
        checkedIds: itemIds,
        ownedIds: ownedIds,
        ownership: itemIds.reduce((acc: any, id: any) => {
          acc[id] = ownedIds.includes(id);
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Inventory check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
