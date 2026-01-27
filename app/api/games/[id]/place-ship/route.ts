import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import { placeShip } from "@/lib/game-logic";
import { eq } from "drizzle-orm";
import type { Game, ShipType } from "@/types/game";
import { sseManager } from "@/lib/sse-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { playerRole, shipType, row, col, isHorizontal } = body;

    if (!playerRole || !shipType || row === undefined || col === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [game] = await db.select().from(games).where(eq(games.id, id)).limit(1);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "placing") {
      return NextResponse.json(
        { error: "Game is not in placing phase" },
        { status: 400 }
      );
    }

    const board = playerRole === "player1" ? game.player1Board : game.player2Board;
    const ships = playerRole === "player1" ? game.player1Ships : game.player2Ships;

    const result = placeShip(
      board,
      ships,
      shipType as ShipType,
      row,
      col,
      isHorizontal
    );

    if (!result) {
      return NextResponse.json(
        { error: "Invalid ship placement" },
        { status: 400 }
      );
    }

    const updatedShips = [...ships, result.ship];
    const updateData: Partial<typeof games.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (playerRole === "player1") {
      updateData.player1Board = result.board;
      updateData.player1Ships = updatedShips;
      if (updatedShips.length === 5) {
        updateData.player1Ready = true;
      }
    } else {
      updateData.player2Board = result.board;
      updateData.player2Ships = updatedShips;
      if (updatedShips.length === 5) {
        updateData.player2Ready = true;
      }
    }

    // Check if both players are ready
    const player1Ready = playerRole === "player1" ? updatedShips.length === 5 : game.player1Ready;
    const player2Ready = playerRole === "player2" ? updatedShips.length === 5 : game.player2Ready;

    if (player1Ready && player2Ready) {
      updateData.status = "playing";
      updateData.currentTurn = "player1";
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

    return NextResponse.json({ game: gameResponse });
  } catch (error) {
    console.error("Error placing ship:", error);
    return NextResponse.json(
      { error: "Failed to place ship" },
      { status: 500 }
    );
  }
}
