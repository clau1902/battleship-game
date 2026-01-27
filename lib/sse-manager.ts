// Server-Sent Events Manager for game updates
// This module manages SSE connections and broadcasts game updates

type SSEController = ReadableStreamDefaultController<Uint8Array>;

interface GameConnection {
  controller: SSEController;
  playerRole: string;
}

class SSEManager {
  private gameConnections: Map<string, Set<GameConnection>> = new Map();

  addConnection(gameId: string, controller: SSEController, playerRole: string) {
    if (!this.gameConnections.has(gameId)) {
      this.gameConnections.set(gameId, new Set());
    }
    this.gameConnections.get(gameId)!.add({ controller, playerRole });
  }

  removeConnection(gameId: string, controller: SSEController) {
    const connections = this.gameConnections.get(gameId);
    if (connections) {
      for (const conn of connections) {
        if (conn.controller === controller) {
          connections.delete(conn);
          break;
        }
      }
      if (connections.size === 0) {
        this.gameConnections.delete(gameId);
      }
    }
  }

  broadcastGameUpdate(gameId: string, gameData: any) {
    const connections = this.gameConnections.get(gameId);
    if (connections) {
      const message = `data: ${JSON.stringify({ type: "game", game: gameData })}\n\n`;
      const encodedMessage = new TextEncoder().encode(message);

      for (const conn of connections) {
        try {
          conn.controller.enqueue(encodedMessage);
        } catch (error) {
          // Connection might be closed, will be cleaned up on next attempt
          console.error("Error sending SSE message:", error);
        }
      }
    }
  }

  getConnectionCount(gameId: string): number {
    return this.gameConnections.get(gameId)?.size || 0;
  }
}

// Singleton instance - use global to persist across hot reloads in development
const globalForSSE = globalThis as unknown as {
  sseManager: SSEManager | undefined;
};

export const sseManager = globalForSSE.sseManager ?? new SSEManager();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseManager = sseManager;
}
