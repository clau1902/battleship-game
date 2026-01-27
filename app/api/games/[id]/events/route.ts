import { NextRequest } from "next/server";
import db from "@/lib/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sseManager } from "@/lib/sse-manager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playerRole = request.nextUrl.searchParams.get("role");

  if (!playerRole || (playerRole !== "player1" && playerRole !== "player2")) {
    return new Response("Invalid player role", { status: 400 });
  }

  // Verify game exists
  const [game] = await db.select().from(games).where(eq(games.id, id)).limit(1);
  if (!game) {
    return new Response("Game not found", { status: 404 });
  }

  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;

      // Add this connection to the SSE manager
      sseManager.addConnection(id, controller, playerRole);

      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ type: "connected", gameId: id, playerRole })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectMessage));

      // Send current game state
      const gameResponse = {
        _id: game.id,
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        currentTurn: game.currentTurn,
        status: game.status,
        player1Board: game.player1Board,
        player2Board: game.player2Board,
        player1Ships: game.player1Ships,
        player2Ships: game.player2Ships,
        player1Ready: game.player1Ready,
        player2Ready: game.player2Ready,
        winner: game.winner,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      };
      const initialMessage = `data: ${JSON.stringify({ type: "game", game: gameResponse })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialMessage));
    },
    cancel() {
      // Remove this connection when the client disconnects
      if (controllerRef) {
        sseManager.removeConnection(id, controllerRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
