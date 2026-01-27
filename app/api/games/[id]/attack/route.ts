import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import {
  attackCell,
  checkGameOver,
  getOpponentBoard,
  getOpponentShips,
} from "@/lib/game-logic";
import { eq } from "drizzle-orm";
import type { Game, PlayerRole } from "@/types/game";
import { sseManager } from "@/lib/sse-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { playerRole, row, col } = body;

    if (!playerRole || row === undefined || col === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [game] = await db.select().from(games).where(eq(games.id, id)).limit(1);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "playing") {
      return NextResponse.json(
        { error: "Game is not in playing phase" },
        { status: 400 }
      );
    }

    if (game.currentTurn !== playerRole) {
      return NextResponse.json(
        { error: "Not your turn" },
        { status: 400 }
      );
    }

    // Convert database row to Game type for game logic functions
    const gameForLogic: Game = {
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

    const opponentBoard = getOpponentBoard(gameForLogic, playerRole);
    const opponentShips = getOpponentShips(gameForLogic, playerRole);

    const result = attackCell(opponentBoard, opponentShips, row, col);

    const updateData: Partial<typeof games.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (playerRole === "player1") {
      updateData.player2Board = opponentBoard;
      updateData.player2Ships = opponentShips;
    } else {
      updateData.player1Board = opponentBoard;
      updateData.player1Ships = opponentShips;
    }

    // Check if game is over
    if (checkGameOver(opponentShips)) {
      updateData.status = "finished";
      updateData.winner = playerRole;
    } else if (!result.hit) {
      // Switch turn if miss
      updateData.currentTurn = playerRole === "player1" ? "player2" : "player1";
    }

    await db.update(games).set(updateData).where(eq(games.id, id));

    const [updatedGame] = await db.select().from(games).where(eq(games.id, id)).limit(1);

    if (!updatedGame) {
      return NextResponse.json(
        { error: "Failed to update game" },
        { status: 500 }
      );
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

    return NextResponse.json({ game: gameResponse, result });
  } catch (error: any) {
    console.error("Error attacking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to attack" },
      { status: 500 }
    );
  }
}
