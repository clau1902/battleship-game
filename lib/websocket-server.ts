import { WebSocketServer, WebSocket } from "ws";
import type { Game } from "@/types/game";

interface GameConnection {
  gameId: string;
  playerRole: "player1" | "player2";
  ws: WebSocket;
}

class GameWebSocketServer {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, GameConnection[]> = new Map();

  initialize(port: number = 3001) {
    if (this.wss) {
      return; // Already initialized
    }

    this.wss = new WebSocketServer({ port });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("WebSocket client connected");

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });

    console.log(`WebSocket server running on ws://localhost:${port}`);
  }

  private handleMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case "join":
        this.handleJoin(ws, data.gameId, data.playerRole);
        break;
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
    }
  }

  private handleJoin(ws: WebSocket, gameId: string, playerRole: "player1" | "player2") {
    // Remove from any previous game
    this.handleDisconnect(ws);

    // Add to new game
    const connection: GameConnection = { gameId, playerRole, ws };
    
    if (!this.connections.has(gameId)) {
      this.connections.set(gameId, []);
    }
    
    this.connections.get(gameId)!.push(connection);

    console.log(`Player ${playerRole} joined game ${gameId}`);
    
    ws.send(JSON.stringify({
      type: "joined",
      gameId,
      playerRole,
    }));
  }

  private handleDisconnect(ws: WebSocket) {
    for (const [gameId, connections] of this.connections.entries()) {
      const index = connections.findIndex((conn) => conn.ws === ws);
      if (index !== -1) {
        connections.splice(index, 1);
        if (connections.length === 0) {
          this.connections.delete(gameId);
        }
        break;
      }
    }
  }

  broadcastGameUpdate(gameId: string, game: Game) {
    const connections = this.connections.get(gameId);
    if (!connections) {
      return;
    }

    const message = JSON.stringify({
      type: "gameUpdate",
      game,
    });

    connections.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    });
  }

  close() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.connections.clear();
  }
}

// Singleton instance
export const gameWebSocketServer = new GameWebSocketServer();
