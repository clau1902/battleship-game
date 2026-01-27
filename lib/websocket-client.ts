"use client";

import type { Game, PlayerRole } from "@/types/game";
import { getOpponentView, getPlayerView } from "./game-mask";

export class GameWebSocketClient {
  private ws: WebSocket | null = null;
  private gameId: string | null = null;
  private playerRole: PlayerRole | null = null;
  private onGameUpdate: ((game: Game) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(gameId: string, playerRole: PlayerRole, onUpdate: (game: Game) => void) {
    this.gameId = gameId;
    this.playerRole = playerRole;
    this.onGameUpdate = onUpdate;

    this.establishConnection();
  }

  private establishConnection() {
    if (!this.gameId || !this.playerRole) return;

    // Use same hostname as the page, different port for WebSocket
    const wsUrl = typeof window !== "undefined" 
      ? `ws://${window.location.hostname}:3001`
      : "ws://localhost:3001";
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        
        // Send join message
        this.ws?.send(JSON.stringify({
          type: "join",
          gameId: this.gameId,
          playerRole: this.playerRole,
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "gameUpdate" && data.game && this.onGameUpdate) {
            // Apply masking based on player role
            const maskedGame = this.playerRole === "player1"
              ? getPlayerView(data.game, "player1")
              : getPlayerView(data.game, "player2");
            
            this.onGameUpdate(maskedGame);
          } else if (data.type === "joined") {
            console.log("Joined game via WebSocket");
          } else if (data.type === "pong") {
            // Heartbeat response
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.attemptReconnect();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.gameId = null;
    this.playerRole = null;
    this.onGameUpdate = null;
    this.reconnectAttempts = 0;
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
