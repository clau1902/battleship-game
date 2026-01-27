"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
}

interface WelcomeScreenProps {
  onStart: () => void;
  user?: User | null;
}

export function WelcomeScreen({ onStart, user }: WelcomeScreenProps) {
  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="space-y-4">
          {user && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{user.name}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}
          <div className="text-6xl mb-4">🚢</div>
          <CardTitle className="text-4xl font-bold">Battleship</CardTitle>
          <CardDescription className="text-lg">
            The classic naval combat game. Sink your opponent&apos;s fleet before they sink yours!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Place your ships strategically on your board</p>
            <p>• Take turns firing at your opponent&apos;s grid</p>
            <p>• First to sink all enemy ships wins!</p>
          </div>
          <Button onClick={onStart} size="lg" className="w-full text-lg py-6">
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
