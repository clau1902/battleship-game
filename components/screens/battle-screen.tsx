"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameBoard } from "@/components/game-board";
import { signOut, useSession } from "@/lib/auth-client";
import type { Game, PlayerRole, Cell } from "@/types/game";

interface BattleScreenProps {
  game: Game;
  playerRole: PlayerRole;
  playerBoard: Cell[][];
  opponentBoard: Cell[][];
  onAttack: (row: number, col: number) => void;
  onRefresh: (silent?: boolean) => void;
}

export function BattleScreen({
  game,
  playerRole,
  playerBoard,
  opponentBoard,
  onAttack,
  onRefresh
}: BattleScreenProps) {
  const { data: session } = useSession();
  const isMyTurn = game.currentTurn === playerRole;

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const playerShips = playerRole === "player1" ? game.player1Ships : game.player2Ships;
  const opponentShips = playerRole === "player1" ? game.player2Ships : game.player1Ships;

  const playerSunkCount = playerShips.filter(s => s.isSunk).length;
  const opponentSunkCount = opponentShips.filter(s => s.isSunk).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {session?.user && (
          <div className="flex items-center justify-end text-sm">
            <span className="text-muted-foreground mr-2">
              Playing as <span className="font-medium text-foreground">{session.user.name}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        )}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Battle!</h1>
          <div className="flex items-center justify-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              isMyTurn
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}>
              {isMyTurn ? "Your Turn" : "Opponent's Turn"}
            </span>
            <Button
              onClick={() => onRefresh(false)}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GameBoard
                board={playerBoard}
                showShips={false}
                disabled={true}
                title="Your Fleet"
              />
              <GameBoard
                board={opponentBoard}
                onCellClick={isMyTurn ? onAttack : undefined}
                showShips={false}
                disabled={!isMyTurn}
                title="Enemy Waters"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Battle Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Ships Lost</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded ${
                          i < playerSunkCount ? "bg-red-500" : "bg-blue-500"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Enemy Ships Sunk</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded ${
                          i < opponentSunkCount ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {isMyTurn ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Your Turn</CardTitle>
                  <CardDescription className="text-green-700">
                    Click on the enemy grid to fire!
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-800">Waiting...</CardTitle>
                  <CardDescription className="text-amber-700">
                    Opponent is choosing their target
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span>Hit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded" />
                  <span>Miss</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-800 rounded" />
                  <span>Sunk</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
