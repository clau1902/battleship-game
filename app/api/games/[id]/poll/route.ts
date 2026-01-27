import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Game } from "@/types/game";

const POLL_TIMEOUT = 30000; // 30 seconds max wait
const POLL_INTERVAL = 500; // Check every 500ms

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get("since");
    const sinceTime = since ? new Date(since) : null;

    const startTime = Date.now();

    // Poll until timeout or game update
    while (Date.now() - startTime < POLL_TIMEOUT) {
      const [game] = await db.select().from(games).where(eq(games.id, id)).limit(1);

      if (!game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }

      // If game was updated after the 'since' timestamp, return immediately
      if (!sinceTime || game.updatedAt > sinceTime) {
        const gameResponse: Game = {
          _id: game.id,
          player1Id: game.player1Id,
          player2Id: game.player2Id || undefined,
          currentTurn: game.currentTurn as "player1" | "player2",
          status: game.status as Game["status"],
          player1Board: game.player1Board,
          player2Board: game.player2Board,
          player1Ships: game.player1Ships,
          player2Ships: game.player2Ships,
          player1Ready: game.player1Ready,
          player2Ready: game.player2Ready,
          winner: game.winner as "player1" | "player2" | undefined,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        };

        return NextResponse.json({
          game: gameResponse,
          updated: true,
        });
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }

    // Timeout - return current state with updated: false
    const [game] = await db.select().from(games).where(eq(games.id, id)).limit(1);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const gameResponse: Game = {
      _id: game.id,
      player1Id: game.player1Id,
      player2Id: game.player2Id || undefined,
      currentTurn: game.currentTurn as "player1" | "player2",
      status: game.status as Game["status"],
      player1Board: game.player1Board,
      player2Board: game.player2Board,
      player1Ships: game.player1Ships,
      player2Ships: game.player2Ships,
      player1Ready: game.player1Ready,
      player2Ready: game.player2Ready,
      winner: game.winner as "player1" | "player2" | undefined,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    return NextResponse.json({
      game: gameResponse,
      updated: false,
    });
  } catch (error) {
    console.error("Error in long poll:", error);
    return NextResponse.json(
      { error: "Failed to poll game" },
      { status: 500 }
    );
  }
}
