import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import { createEmptyBoard } from "@/lib/game-logic";
import { eq, and, isNull, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Game } from "@/types/game";

export async function POST(request: NextRequest) {
  try {
    // Find the first available game (status "placing" or "waiting" and no player2Id)
    // Try to find games with null player2Id first
    let availableGames = await db
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
      .limit(1);
    
    // If no games found with null, try finding games with empty string player2Id (fallback)
    if (availableGames.length === 0) {
      const allGames = await db
        .select()
        .from(games)
        .where(
          or(
            eq(games.status, "placing"),
            eq(games.status, "waiting")
          )
        )
        .limit(10);
      
      // Filter in JavaScript for games without player2Id (null or empty)
      availableGames = allGames.filter((g) => !g.player2Id || g.player2Id.trim() === "");
    }
    
    const availableGame = availableGames[0];

    if (!availableGame) {
      // No available game, create a new one
      const player1Id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const gameId = randomUUID();

      const newGame = {
        id: gameId,
        player1Id,
        currentTurn: "player1" as const,
        status: "placing" as const,
        player1Board: createEmptyBoard(),
        player2Board: createEmptyBoard(),
        player1Ships: [],
        player2Ships: [],
        player1Ready: false,
        player2Ready: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(games).values(newGame);

      const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);

      if (!game) {
        return NextResponse.json(
          { error: "Failed to create game" },
          { status: 500 }
        );
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
        role: "player1",
        created: true 
      }, { status: 201 });
    }

    // Join the available game (with race condition check)
    const player2Id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update only if player2Id is still null (race condition protection)
    await db
      .update(games)
      .set({
        player2Id,
        status: "placing",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(games.id, availableGame.id),
          isNull(games.player2Id)
        )
      );

    const [updatedGame] = await db
      .select()
      .from(games)
      .where(eq(games.id, availableGame.id))
      .limit(1);

    if (!updatedGame) {
      return NextResponse.json(
        { error: "Failed to join game" },
        { status: 500 }
      );
    }

    // Check if we actually joined (race condition - another player might have joined first)
    if (updatedGame.player2Id !== player2Id) {
      // Someone else joined first, try to find another game
      return NextResponse.json(
        { error: "Game was already taken, please try again" },
        { status: 409 }
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

    return NextResponse.json({ 
      game: gameResponse, 
      role: "player2",
      created: false 
    });
  } catch (error: any) {
    console.error("Error finding match:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to find match" },
      { status: 500 }
    );
  }
}

