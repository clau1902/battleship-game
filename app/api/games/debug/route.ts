import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get all games for debugging
    const allGames = await db.select().from(games).limit(20);
    
    // Get available games
    const availableGames = await db
      .select()
      .from(games)
      .where(
        and(
          or(
            eq(games.status, "placing"),
            eq(games.status, "waiting")
          ),
          isNull(games.player2Id)
        )
      )
      .limit(10);

    return NextResponse.json({
      totalGames: allGames.length,
      availableGames: availableGames.length,
      games: allGames.map((g) => ({
        id: g.id,
        status: g.status,
        player1Id: g.player1Id,
        player2Id: g.player2Id,
        player1Ready: g.player1Ready,
        player2Ready: g.player2Ready,
        createdAt: g.createdAt,
      })),
      available: availableGames.map((g) => ({
        id: g.id,
        status: g.status,
        player1Id: g.player1Id,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to get debug info" },
      { status: 500 }
    );
  }
}
