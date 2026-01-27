"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import type { Game, PlayerRole, ShipType, GameScreen } from "@/types/game";
import { GameSSEClient } from "@/lib/sse-client";
import { getPlayerView } from "@/lib/game-mask";
import { useSession } from "@/lib/auth-client";
import {
  AuthScreen,
  WelcomeScreen,
  SetupScreen,
  PlacingScreen,
  BattleScreen,
  ResultsScreen,
} from "@/components/screens";

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerRole | null>(null);
  const [screen, setScreen] = useState<GameScreen>("auth");
  const [sseClient, setSSEClient] = useState<GameSSEClient | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  // Check authentication status
  useEffect(() => {
    if (!isSessionLoading) {
      if (session) {
        // User is logged in, go to setup screen to start playing
        if (screen === "auth") {
          setScreen("setup");
        }
      } else {
        // User is not logged in, show auth screen
        setScreen("auth");
      }
    }
  }, [session, isSessionLoading, screen]);

  // Update URL with game info
  const updateUrl = useCallback((gameId: string | null, role: PlayerRole | null) => {
    if (gameId && role) {
      const url = new URL(window.location.href);
      url.searchParams.set("game", gameId);
      url.searchParams.set("role", role);
      window.history.replaceState({}, "", url.toString());
    } else {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Determine the appropriate screen based on game state
  const determineScreen = useCallback((game: Game | null, role: PlayerRole | null): GameScreen => {
    if (!session) {
      return "auth";
    }
    if (!game || !role) {
      return "setup";
    }

    switch (game.status) {
      case "waiting":
      case "placing":
        return "placing";
      case "playing":
        return "battle";
      case "finished":
        return "results";
      default:
        return "setup";
    }
  }, [session]);

  // Load saved game from sessionStorage or URL
  useEffect(() => {
    const urlGameId = searchParams.get("game");
    const urlRole = searchParams.get("role") as PlayerRole | null;

    const savedGame = sessionStorage.getItem("battleship-game");
    const savedRole = sessionStorage.getItem("battleship-role");

    // If URL has game info but session doesn't match, try to load from URL
    if (urlGameId && urlRole && (!savedGame || JSON.parse(savedGame)?._id !== urlGameId)) {
      // Fetch game from server
      fetch(`/api/games?id=${urlGameId}`)
        .then(res => res.json())
        .then(data => {
          if (data.game && data.game.status !== "finished") {
            const maskedGame = getPlayerView(data.game, urlRole);
            setGame(maskedGame);
            setPlayerRole(urlRole);
            setScreen(determineScreen(maskedGame, urlRole));
            sessionStorage.setItem("battleship-game", JSON.stringify(maskedGame));
            sessionStorage.setItem("battleship-role", urlRole);
          }
        })
        .catch(e => console.error("Error loading game from URL:", e));
      return;
    }

    if (savedGame && savedRole) {
      try {
        const parsedGame = JSON.parse(savedGame);
        if (parsedGame.status !== "finished") {
          const maskedGame = getPlayerView(parsedGame, savedRole as PlayerRole);
          setGame(maskedGame);
          setPlayerRole(savedRole as PlayerRole);
          setScreen(determineScreen(maskedGame, savedRole as PlayerRole));
          updateUrl(parsedGame._id, savedRole as PlayerRole);
        } else {
          sessionStorage.removeItem("battleship-game");
          sessionStorage.removeItem("battleship-role");
          updateUrl(null, null);
        }
      } catch (e) {
        console.error("Error loading saved game:", e);
      }
    }
  }, [searchParams, updateUrl]);

  // Update screen when game state changes
  useEffect(() => {
    if (game && playerRole) {
      const newScreen = determineScreen(game, playerRole);
      if (newScreen !== screen && newScreen !== "welcome" && newScreen !== "setup") {
        setScreen(newScreen);
      }
    }
  }, [game?.status, playerRole, determineScreen, screen]);

  // Update document title based on game state
  useEffect(() => {
    if (!game || !playerRole) {
      document.title = "Battleship";
      return;
    }

    const shortId = game._id?.slice(-6) || "";
    const roleLabel = playerRole === "player1" ? "P1" : "P2";
    const statusLabel = game.status === "placing" ? "Setup"
      : game.status === "playing"
        ? (game.currentTurn === playerRole ? "Your Turn" : "Waiting")
        : game.status === "finished"
          ? (game.winner === playerRole ? "Won!" : "Lost")
          : "";

    document.title = `${statusLabel} - ${roleLabel} - ${shortId} | Battleship`;
  }, [game, playerRole, game?.status, game?.currentTurn]);

  // Long polling for real-time updates
  useEffect(() => {
    if (!game || !game._id || !playerRole || game.status === "finished") {
      return;
    }

    // Determine if we should poll
    const shouldPoll =
      // During placing: poll if waiting for opponent to join or finish
      (game.status === "placing" && (!game.player2Id || (playerRole === "player1" ? game.player1Ready : game.player2Ready))) ||
      // During playing: poll if it's opponent's turn
      (game.status === "playing" && game.currentTurn !== playerRole);

    if (!shouldPoll) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const longPoll = async () => {
      while (!cancelled) {
        try {
          const since = game.updatedAt ? new Date(game.updatedAt).toISOString() : "";
          const response = await fetch(
            `/api/games/${game._id}/poll?since=${encodeURIComponent(since)}`,
            { signal: controller.signal }
          );

          if (cancelled) break;

          const data = await response.json();
          if (response.ok && data.game) {
            const maskedGame = getPlayerView(data.game, playerRole);

            setGame((prevGame) => {
              if (!prevGame) return maskedGame;

              // Show notifications for significant changes
              if (!prevGame.player2Id && data.game.player2Id && playerRole === "player1") {
                toast({
                  title: "Opponent Joined!",
                  description: "Another player has joined the game",
                });
              }

              if (prevGame.status === "placing" && data.game.status === "playing") {
                toast({
                  title: "Game Started!",
                  description: "Both players have placed their ships. Let the battle begin!",
                });
              }

              return maskedGame;
            });

            sessionStorage.setItem("battleship-game", JSON.stringify(maskedGame));
          }
        } catch (error: any) {
          if (error.name === "AbortError" || cancelled) {
            break;
          }
          // On error, wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    };

    longPoll();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [game?._id, game?.status, game?.currentTurn, game?.player2Id, game?.player1Ready, game?.player2Ready, playerRole, toast]);

  // SSE connection for real-time updates
  useEffect(() => {
    if (!game || !game._id || !playerRole || game.status === "finished") {
      if (sseClient) {
        sseClient.disconnect();
        setSSEClient(null);
      }
      return;
    }

    const gameId = game._id;
    const hadPlayer2 = !!game.player2Id;

    const client = new GameSSEClient();
    client.connect(gameId, playerRole, (updatedGame: Game) => {
      const hasPlayer2Changed = !hadPlayer2 && updatedGame.player2Id;

      setGame((prevGame) => {
        if (!prevGame) return updatedGame;

        if (hasPlayer2Changed && playerRole === "player1") {
          toast({
            title: "Opponent Joined!",
            description: "Another player has joined the game",
          });
        }

        if (prevGame.status === "placing" && updatedGame.status === "playing") {
          toast({
            title: "Game Started!",
            description: "Both players have placed their ships. Let the battle begin!",
          });
        }

        return updatedGame;
      });

      sessionStorage.setItem("battleship-game", JSON.stringify(updatedGame));
    });

    setSSEClient(client);

    return () => {
      client.disconnect();
    };
  }, [game?._id, playerRole]);

  const refreshGame = useCallback(async (silent = false) => {
    if (!game || !game._id || !playerRole) return;

    try {
      const response = await fetch(`/api/games?id=${game._id}`);
      const data = await response.json();
      if (response.ok && data.game) {
        const maskedGame = getPlayerView(data.game, playerRole);
        setGame(maskedGame);
        sessionStorage.setItem("battleship-game", JSON.stringify(maskedGame));
        if (!silent) {
          toast({
            title: "Game Updated",
            description: "Game state refreshed",
          });
        }
      }
    } catch (error) {
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to refresh game",
          variant: "destructive",
        });
      }
    }
  }, [game, playerRole, toast]);

  const createGame = async () => {
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        const maskedGame = getPlayerView(data.game, "player1");
        setGame(maskedGame);
        setPlayerRole("player1");
        setScreen("placing");
        sessionStorage.setItem("battleship-game", JSON.stringify(maskedGame));
        sessionStorage.setItem("battleship-role", "player1");
        updateUrl(data.game._id, "player1");
        toast({
          title: "Game Created",
          description: `Game ID: ${data.game._id}`,
        });
      } else {
        const errorMsg = data.error || "Failed to create game";
        const hint = data.hint ? `\n\n${data.hint}` : "";
        toast({
          title: "Error",
          description: `${errorMsg}${hint}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    }
  };

  const joinGame = async (gameId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}/join`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        const maskedGame = getPlayerView(data.game, "player2");
        setGame(maskedGame);
        setPlayerRole("player2");
        setScreen("placing");
        sessionStorage.setItem("battleship-game", JSON.stringify(maskedGame));
        sessionStorage.setItem("battleship-role", "player2");
        updateUrl(data.game._id, "player2");
        toast({
          title: "Joined Game",
          description: "You are now player 2",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to join game",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join game",
        variant: "destructive",
      });
    }
  };

  const findMatch = async (retryCount = 0) => {
    try {
      const response = await fetch("/api/games/find-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        const maskedGame = getPlayerView(data.game, data.role);
        setGame(maskedGame);
        setPlayerRole(data.role);
        setScreen("placing");
        sessionStorage.setItem("battleship-game", JSON.stringify(maskedGame));
        sessionStorage.setItem("battleship-role", data.role);
        updateUrl(data.game._id, data.role);
        toast({
          title: data.created ? "Game Created" : "Match Found!",
          description: data.created
            ? "Waiting for an opponent to join"
            : "You joined as player 2!",
        });
      } else if (response.status === 409 && retryCount < 3) {
        toast({
          title: "Game Taken",
          description: "Someone else joined first. Trying again...",
        });
        setTimeout(() => findMatch(retryCount + 1), 1000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to find match",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find match",
        variant: "destructive",
      });
    }
  };

  const placeShip = async (row: number, col: number, shipType: ShipType, isHorizontal: boolean) => {
    if (!game || !playerRole) return;

    try {
      const response = await fetch(`/api/games/${game._id}/place-ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerRole,
          shipType,
          row,
          col,
          isHorizontal,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const updatedGame = data.game;
        const maskedGame = getPlayerView(updatedGame, playerRole);
        setGame(maskedGame);
        sessionStorage.setItem("battleship-game", JSON.stringify(maskedGame));

        const updatedShips =
          playerRole === "player1" ? updatedGame.player1Ships : updatedGame.player2Ships;
        const remainingCount = 5 - updatedShips.length;

        if (remainingCount === 0) {
          toast({
            title: "All Ships Placed!",
            description:
              updatedGame.status === "playing"
                ? "Game is starting!"
                : "Waiting for opponent to finish placing ships...",
          });
        } else {
          toast({
            title: "Ship Placed",
            description: `${shipType} placed successfully (${remainingCount} remaining)`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to place ship",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place ship",
        variant: "destructive",
      });
    }
  };

  const attack = async (row: number, col: number) => {
    if (!game || !playerRole) return;

    try {
      const response = await fetch(`/api/games/${game._id}/attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerRole, row, col }),
      });
      const data = await response.json();
      if (response.ok) {
        const maskedGame = getPlayerView(data.game, playerRole);
        setGame(maskedGame);
        sessionStorage.setItem("battleship-game", JSON.stringify(maskedGame));
        if (data.result.hit) {
          toast({
            title: "Hit!",
            description: data.result.sunk
              ? `You sunk their ${data.result.shipType}!`
              : "You hit a ship!",
          });
        } else {
          toast({
            title: "Miss",
            description: "You missed",
          });
        }
        if (data.game.status === "finished") {
          toast({
            title: data.game.winner === playerRole ? "Victory!" : "Defeat",
            description:
              data.game.winner === playerRole
                ? "Congratulations!"
                : "Better luck next time!",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to attack",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to attack",
        variant: "destructive",
      });
    }
  };

  const playAgain = () => {
    sessionStorage.removeItem("battleship-game");
    sessionStorage.removeItem("battleship-role");
    setGame(null);
    setPlayerRole(null);
    setScreen("setup");
    updateUrl(null, null);
  };

  const getPlayerBoard = () => {
    if (!game || !playerRole) return null;
    return playerRole === "player1" ? game.player1Board : game.player2Board;
  };

  const getOpponentBoard = () => {
    if (!game || !playerRole) return null;
    return playerRole === "player1" ? game.player2Board : game.player1Board;
  };

  // Render the appropriate screen
  const renderScreen = () => {
    // Show loading while checking session
    if (isSessionLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="text-4xl mb-4">🚢</div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    switch (screen) {
      case "auth":
        return <AuthScreen onSuccess={() => setScreen("setup")} />;

      case "welcome":
        return <WelcomeScreen onStart={() => setScreen("setup")} user={session?.user} />;

      case "setup":
        return (
          <SetupScreen
            onFindMatch={() => findMatch()}
            onCreateGame={createGame}
            onJoinGame={joinGame}
            onBack={() => setScreen("welcome")}
          />
        );

      case "placing":
        if (!game || !playerRole) {
          setScreen("setup");
          return null;
        }
        return (
          <PlacingScreen
            game={game}
            playerRole={playerRole}
            playerBoard={getPlayerBoard()!}
            onPlaceShip={placeShip}
            onRefresh={refreshGame}
          />
        );

      case "battle":
        if (!game || !playerRole) {
          setScreen("setup");
          return null;
        }
        return (
          <BattleScreen
            game={game}
            playerRole={playerRole}
            playerBoard={getPlayerBoard()!}
            opponentBoard={getOpponentBoard()!}
            onAttack={attack}
            onRefresh={refreshGame}
          />
        );

      case "results":
        if (!game || !playerRole) {
          setScreen("setup");
          return null;
        }
        return (
          <ResultsScreen
            game={game}
            playerRole={playerRole}
            playerBoard={getPlayerBoard()!}
            opponentBoard={getOpponentBoard()!}
            onPlayAgain={playAgain}
          />
        );

      default:
        return (
          <SetupScreen
            onFindMatch={() => findMatch()}
            onCreateGame={createGame}
            onJoinGame={joinGame}
            onBack={() => setScreen("setup")}
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <Toaster />
    </>
  );
}
