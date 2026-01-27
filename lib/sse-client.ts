"use client";

import type { Game, PlayerRole } from "@/types/game";
import { getPlayerView } from "@/lib/game-mask";

export class GameSSEClient {
  private eventSource: EventSource | null = null;
  private gameId: string | null = null;
  private playerRole: PlayerRole | null = null;
  private onGameUpdate: ((game: Game) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  connect(
    gameId: string,
    playerRole: PlayerRole,
    onGameUpdate: (game: Game) => void
  ) {
    this.gameId = gameId;
    this.playerRole = playerRole;
    this.onGameUpdate = onGameUpdate;
    this.reconnectAttempts = 0;
    this.establishConnection();
  }

  private establishConnection() {
    if (!this.gameId || !this.playerRole) return;

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `/api/games/${this.gameId}/events?role=${this.playerRole}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log("SSE connection established");
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("SSE connected to game:", data.gameId);
        } else if (data.type === "game" && data.game && this.onGameUpdate && this.playerRole) {
          // Apply game masking to hide opponent information
          const maskedGame = getPlayerView(data.game, this.playerRole);
          this.onGameUpdate(maskedGame);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      this.eventSource?.close();
      this.attemptReconnect();
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.gameId = null;
    this.playerRole = null;
    this.onGameUpdate = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
