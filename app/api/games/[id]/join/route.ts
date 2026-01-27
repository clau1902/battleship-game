import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Game } from "@/types/game";
import { sseManager } from "@/lib/sse-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [game] = await db.select().from(games).where(eq(games.id, id)).limit(1);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.player2Id) {
      return NextResponse.json(
        { error: "Game is full" },
        { status: 400 }
      );
    }

    const player2Id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db
      .update(games)
      .set({
        player2Id,
        status: "placing",
        updatedAt: new Date(),
      })
      .where(eq(games.id, id));

    const [updatedGame] = await db.select().from(games).where(eq(games.id, id)).limit(1);

    if (!updatedGame) {
      return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
    }

    const gameResponse: Game = {
      _id: updatedGame.id,
      player1Id: updatedGame.player1Id,
      player2Id: updatedGame.player2Id || undefined,
      currentTurn: updatedGame.currentTurn as "player1" | "player2",
      status: updatedGame.status as Game["status"],
      player1Board: updatedGame.player1Board,
      player2Board: updatedGame.player2Board,
      player1Ships: updatedGame.player1Ships,
      player2Ships: updatedGame.player2Ships,
      player1Ready: updatedGame.player1Ready,
      player2Ready: updatedGame.player2Ready,
      winner: updatedGame.winner as "player1" | "player2" | undefined,
      createdAt: updatedGame.createdAt,
      updatedAt: updatedGame.updatedAt,
    };

    // Broadcast update via SSE
    sseManager.broadcastGameUpdate(id, gameResponse);

    return NextResponse.json({ game: gameResponse });
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      { error: "Failed to join game" },
      { status: 500 }
    );
  }
}
