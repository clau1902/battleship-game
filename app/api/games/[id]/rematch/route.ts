import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import { createEmptyBoard } from "@/lib/game-logic";
import { eq } from "drizzle-orm";
import type { Game } from "@/types/game";
import { sseManager } from "@/lib/sse-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { playerRole } = body;

    if (!playerRole) {
      return NextResponse.json(
        { error: "Missing playerRole" },
        { status: 400 }
      );
    }

    // Get the original game
    const [originalGame] = await db
      .select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);

    if (!originalGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (originalGame.status !== "finished") {
      return NextResponse.json(
        { error: "Game is not finished" },
        { status: 400 }
      );
    }

    // Create a new game with the same players but swapped roles
    // The loser of the previous game goes first
    const previousWinner = originalGame.winner;
    const player1GoesFirst = previousWinner === "player2";

    const [newGame] = await db
      .insert(games)
      .values({
        player1Id: originalGame.player1Id,
        player2Id: originalGame.player2Id,
        status: "placing",
        currentTurn: player1GoesFirst ? "player1" : "player2",
        player1Board: createEmptyBoard(),
        player2Board: createEmptyBoard(),
        player1Ships: [],
        player2Ships: [],
        player1Ready: false,
        player2Ready: false,
      })
      .returning();

    if (!newGame) {
      return NextResponse.json(
        { error: "Failed to create rematch game" },
        { status: 500 }
      );
    }

    const gameResponse: Game = {
      _id: newGame.id,
      player1Id: newGame.player1Id,
      player2Id: newGame.player2Id || undefined,
      currentTurn: newGame.currentTurn as "player1" | "player2",
      status: newGame.status as Game["status"],
      player1Board: newGame.player1Board,
      player2Board: newGame.player2Board,
      player1Ships: newGame.player1Ships,
      player2Ships: newGame.player2Ships,
      player1Ready: newGame.player1Ready,
      player2Ready: newGame.player2Ready,
      winner: undefined,
      createdAt: newGame.createdAt,
      updatedAt: newGame.updatedAt,
    };

    // Broadcast to both players that a rematch game was created
    // Include rematch info so clients can navigate to the new game
    sseManager.broadcastGameUpdate(id, {
      ...gameResponse,
      rematchGameId: newGame.id,
    });

    return NextResponse.json({ game: gameResponse });
  } catch (error) {
    console.error("Error creating rematch:", error);
    return NextResponse.json(
      { error: "Failed to create rematch" },
      { status: 500 }
    );
  }
}
