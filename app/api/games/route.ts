import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import { createEmptyBoard } from "@/lib/game-logic";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Game } from "@/types/game";

export async function POST(request: NextRequest) {
  try {
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

    // Convert database row to Game type
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

    return NextResponse.json({ game: gameResponse }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating game:", error);
    const errorMessage = error?.message || "Failed to create game";
    const errorCode = error?.code || error?.name;
    const errorDetails = {
      message: errorMessage,
      code: errorCode,
      hint: errorCode === "42P01" 
        ? "Database table 'games' does not exist. Run: bun run db:push"
        : errorCode === "ECONNREFUSED" || errorCode === "ENOTFOUND"
        ? "Cannot connect to database. Check your DATABASE_URL in .env.local"
        : undefined,
    };
    return NextResponse.json(
      { error: errorMessage, ...errorDetails },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get("id");

    if (gameId) {
      const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
      
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

      return NextResponse.json({ game: gameResponse });
    }

    // Find games that need a second player (status is "placing" or "waiting" and no player2Id)
    const gameRows = await db
      .select()
      .from(games)
      .where(eq(games.status, "placing"))
      .limit(10);
    
    // Filter to only games without a second player
    const availableGames = gameRows.filter((game) => !game.player2Id);

    const gamesResponse: Game[] = availableGames.map((game) => ({
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
    }));

    return NextResponse.json({ games: gamesResponse });
  } catch (error: any) {
    console.error("Error fetching games:", error);
    const errorMessage = error?.message || "Failed to fetch games";
    return NextResponse.json(
      { error: errorMessage, details: error?.code },
      { status: 500 }
    );
  }
}
