import type { Cell, CellStatus, Game, PlayerRole } from "@/types/game";

/**
 * Masks the board to hide ship positions from opponent
 * Only shows: empty, hit, miss, sunk
 * Hides: ship (shows as empty until hit)
 */
export function maskBoardForOpponent(board: Cell[][]): Cell[][] {
  return board.map((row) =>
    row.map((cell) => {
      // If it's a ship that hasn't been hit, show as empty
      if (cell.status === "ship") {
        return {
          ...cell,
          status: "empty" as CellStatus,
          shipId: undefined, // Hide ship ID
        };
      }
      // Otherwise, show the actual status (hit, miss, sunk, empty)
      return cell;
    })
  );
}

/**
 * Gets the opponent's view of the game (with masked boards)
 */
export function getOpponentView(game: Game, playerRole: PlayerRole): Game {
  if (playerRole === "player1") {
    return {
      ...game,
      player2Board: maskBoardForOpponent(game.player2Board),
      // Don't reveal opponent's ships
      player2Ships: game.player2Ships.map((ship) => ({
        ...ship,
        positions: [], // Hide ship positions
      })),
    };
  } else {
    return {
      ...game,
      player1Board: maskBoardForOpponent(game.player1Board),
      // Don't reveal opponent's ships
      player1Ships: game.player1Ships.map((ship) => ({
        ...ship,
        positions: [], // Hide ship positions
      })),
    };
  }
}

/**
 * Gets the player's own view (shows ships during placement, hides during gameplay)
 */
export function getPlayerView(game: Game, playerRole: PlayerRole): Game {
  const view = { ...game };
  
  // During gameplay, hide ships on own board (only show hits/misses)
  if (game.status === "playing" || game.status === "finished") {
    if (playerRole === "player1") {
      view.player1Board = game.player1Board.map((row) =>
        row.map((cell) => {
          // Show hits, misses, sunk, but hide un-hit ships
          if (cell.status === "ship") {
            return {
              ...cell,
              status: "empty" as CellStatus,
            };
          }
          return cell;
        })
      );
    } else {
      view.player2Board = game.player2Board.map((row) =>
        row.map((cell) => {
          // Show hits, misses, sunk, but hide un-hit ships
          if (cell.status === "ship") {
            return {
              ...cell,
              status: "empty" as CellStatus,
            };
          }
          return cell;
        })
      );
    }
  }
  
  return view;
}
