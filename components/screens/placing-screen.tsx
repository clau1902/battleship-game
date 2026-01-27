"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameBoard } from "@/components/game-board";
import type { Game, PlayerRole, ShipType, Cell } from "@/types/game";
import { SHIP_CONFIGS } from "@/lib/game-logic";

interface PlacingScreenProps {
  game: Game;
  playerRole: PlayerRole;
  playerBoard: Cell[][];
  onPlaceShip: (row: number, col: number, shipType: ShipType, isHorizontal: boolean) => void;
  onRefresh: (silent?: boolean) => void;
}

export function PlacingScreen({
  game,
  playerRole,
  playerBoard,
  onPlaceShip,
  onRefresh
}: PlacingScreenProps) {
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [isHorizontal, setIsHorizontal] = useState(true);

  const ships = playerRole === "player1" ? game.player1Ships : game.player2Ships;
  const placedTypes = ships.map((s) => s.type);
  const remainingShips = (Object.keys(SHIP_CONFIGS) as ShipType[]).filter(
    (type) => !placedTypes.includes(type)
  );

  const allShipsPlaced = remainingShips.length === 0;

  const handleCellClick = (row: number, col: number) => {
    if (selectedShip && !allShipsPlaced) {
      onPlaceShip(row, col, selectedShip, isHorizontal);
      setSelectedShip(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Place Your Ships</h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-muted-foreground">Game ID: {game._id}</p>
            <Button
              onClick={() => onRefresh(false)}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        {!game.player2Id && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4 text-center">
              <p className="text-amber-800">Waiting for opponent to join...</p>
              <p className="text-sm text-amber-600 mt-1">Share the Game ID with a friend</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <GameBoard
              board={playerBoard}
              onCellClick={!allShipsPlaced ? handleCellClick : undefined}
              showShips={true}
              disabled={allShipsPlaced}
              title="Your Board"
            />
          </div>

          <div className="space-y-4">
            {!allShipsPlaced && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Ship</CardTitle>
                  <CardDescription>
                    Choose a ship and click on your board to place it
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {remainingShips.map((shipType) => (
                      <Button
                        key={shipType}
                        onClick={() => setSelectedShip(shipType)}
                        variant={selectedShip === shipType ? "default" : "outline"}
                        className="w-full"
                      >
                        {shipType} ({SHIP_CONFIGS[shipType]} cells)
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setIsHorizontal(!isHorizontal)}
                    variant="secondary"
                    className="w-full"
                  >
                    Orientation: {isHorizontal ? "Horizontal →" : "Vertical ↓"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {allShipsPlaced && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">All Ships Placed!</CardTitle>
                  <CardDescription className="text-green-700">
                    Waiting for opponent to finish placing their ships...
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ships placed:</span>
                    <span className="font-medium">{placedTypes.length} / 5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(placedTypes.length / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
