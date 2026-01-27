"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Game, PlayerRole } from "@/types/game";
import { getPlayerShips } from "@/lib/game-logic";

interface GameStatusProps {
  game: Game;
  playerRole: PlayerRole;
}

export function GameStatus({ game, playerRole }: GameStatusProps) {
  const playerShips = getPlayerShips(game, playerRole);
  const sunkShips = playerShips.filter((ship) => ship.isSunk).length;
  const totalShips = playerShips.length;

  const getStatusMessage = (): string => {
    switch (game.status) {
      case "waiting":
        return "Waiting for opponent to join...";
      case "placing":
        return playerRole === game.currentTurn
          ? "Place your ships"
          : "Waiting for opponent to place ships...";
      case "playing":
        return game.currentTurn === playerRole
          ? "Your turn - Attack!"
          : "Opponent's turn - Waiting...";
      case "finished":
        return game.winner === playerRole
          ? "🎉 You Won!"
          : "😢 You Lost!";
      default:
        return "Unknown status";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Game Status</CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Your Ships:</span>
            <span className="text-sm">
              {totalShips - sunkShips} / {totalShips} remaining
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((totalShips - sunkShips) / totalShips) * 100}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {playerShips.map((ship) => (
              <div
                key={ship.type}
                className={cn(
                  "flex justify-between",
                  ship.isSunk ? "line-through text-destructive" : ""
                )}
              >
                <span>{ship.type}:</span>
                <span>{ship.isSunk ? "Sunk" : "Active"}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

