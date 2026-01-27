"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";

interface SetupScreenProps {
  onFindMatch: () => void;
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
  onBack: () => void;
}

export function SetupScreen({ onFindMatch, onCreateGame, onJoinGame, onBack }: SetupScreenProps) {
  const [gameId, setGameId] = useState("");
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          {session?.user && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{session.user.name}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}
          <div className="text-4xl mb-2">🚢</div>
          <CardTitle>Battleship</CardTitle>
          <CardDescription>Choose how you want to play</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onFindMatch} className="w-full" size="lg">
            Find Match
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Automatically finds an opponent or creates a new game
          </p>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={onCreateGame} className="w-full" variant="outline">
              Create Private Game
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Get a game ID to share with a friend
            </p>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
            <Button
              onClick={() => {
                if (gameId.trim()) {
                  onJoinGame(gameId.trim());
                }
              }}
              className="w-full"
              variant="outline"
              disabled={!gameId.trim()}
            >
              Join by ID
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
