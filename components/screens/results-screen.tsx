"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameBoard } from "@/components/game-board";
import type { Game, PlayerRole, Cell } from "@/types/game";

interface ResultsScreenProps {
  game: Game;
  playerRole: PlayerRole;
  playerBoard: Cell[][];
  opponentBoard: Cell[][];
  onPlayAgain: () => void;
}

export function ResultsScreen({
  game,
  playerRole,
  playerBoard,
  opponentBoard,
  onPlayAgain
}: ResultsScreenProps) {
  const isWinner = game.winner === playerRole;

  const playerShips = playerRole === "player1" ? game.player1Ships : game.player2Ships;
  const opponentShips = playerRole === "player1" ? game.player2Ships : game.player1Ships;

  const playerSunkCount = playerShips.filter(s => s.isSunk).length;
  const opponentSunkCount = opponentShips.filter(s => s.isSunk).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">{isWinner ? "🏆" : "💥"}</div>
          <h1 className={`text-4xl font-bold mb-2 ${
            isWinner ? "text-green-600" : "text-red-600"
          }`}>
            {isWinner ? "Victory!" : "Defeat"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isWinner
              ? "Congratulations! You sunk all enemy ships!"
              : "Your fleet has been destroyed. Better luck next time!"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Final Score</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Ships You Lost</p>
              <p className="text-3xl font-bold text-red-600">{playerSunkCount}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Enemy Ships Sunk</p>
              <p className="text-3xl font-bold text-green-600">{opponentSunkCount}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GameBoard
            board={playerBoard}
            showShips={true}
            disabled={true}
            title="Your Fleet"
          />
          <GameBoard
            board={opponentBoard}
            showShips={true}
            disabled={true}
            title="Enemy Fleet"
          />
        </div>

        <div className="text-center">
          <Button onClick={onPlayAgain} size="lg" className="px-8">
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}
