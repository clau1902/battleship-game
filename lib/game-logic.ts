import type { Cell, Ship, ShipType, CellStatus, Game, PlayerRole, AttackResult } from "@/types/game";

const BOARD_SIZE = 10;
const SHIP_CONFIGS: Record<ShipType, number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

export function createEmptyBoard(): Cell[][] {
  return Array(BOARD_SIZE)
    .fill(null)
    .map((_, row) =>
      Array(BOARD_SIZE)
        .fill(null)
        .map((_, col) => ({
          row,
          col,
          status: "empty" as CellStatus,
        }))
    );
}

export function isValidShipPlacement(
  board: Cell[][],
  shipType: ShipType,
  startRow: number,
  startCol: number,
  isHorizontal: boolean
): boolean {
  const length = SHIP_CONFIGS[shipType];

  if (isHorizontal) {
    if (startCol + length > BOARD_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (board[startRow]?.[startCol + i]?.status !== "empty") {
        return false;
      }
    }
  } else {
    if (startRow + length > BOARD_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (board[startRow + i]?.[startCol]?.status !== "empty") {
        return false;
      }
    }
  }

  return true;
}

export function placeShip(
  board: Cell[][],
  ships: Ship[],
  shipType: ShipType,
  startRow: number,
  startCol: number,
  isHorizontal: boolean
): { board: Cell[][]; ship: Ship } | null {
  if (!isValidShipPlacement(board, shipType, startRow, startCol, isHorizontal)) {
    return null;
  }

  const length = SHIP_CONFIGS[shipType];
  const positions: Array<{ row: number; col: number }> = [];
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  if (isHorizontal) {
    for (let i = 0; i < length; i++) {
      const col = startCol + i;
      newBoard[startRow]![col]!.status = "ship";
      newBoard[startRow]![col]!.shipId = shipType;
      positions.push({ row: startRow, col });
    }
  } else {
    for (let i = 0; i < length; i++) {
      const row = startRow + i;
      newBoard[row]![startCol]!.status = "ship";
      newBoard[row]![startCol]!.shipId = shipType;
      positions.push({ row, col: startCol });
    }
  }

  const ship: Ship = {
    type: shipType,
    length,
    positions,
    isSunk: false,
  };

  return { board: newBoard, ship };
}

export function attackCell(
  board: Cell[][],
  ships: Ship[],
  row: number,
  col: number
): AttackResult {
  const cell = board[row]?.[col];
  if (!cell) {
    throw new Error("Invalid cell coordinates");
  }

  if (cell.status === "hit" || cell.status === "miss") {
    throw new Error("Cell already attacked");
  }

  const hit = cell.status === "ship";
  let sunk = false;
  let shipType: ShipType | undefined;

  if (hit) {
    cell.status = "hit";
    const ship = ships.find((s) =>
      s.positions.some((p) => p.row === row && p.col === col)
    );
    if (ship) {
      shipType = ship.type;
      const allHit = ship.positions.every(
        (p) => board[p.row]?.[p.col]?.status === "hit"
      );
      if (allHit) {
        ship.isSunk = true;
        sunk = true;
        // Mark all cells of sunk ship
        ship.positions.forEach((p) => {
          if (board[p.row]?.[p.col]) {
            board[p.row]![p.col]!.status = "sunk";
          }
        });
      }
    }
  } else {
    cell.status = "miss";
  }

  return {
    hit,
    sunk,
    shipType,
    gameStatus: "playing",
  };
}

export function checkGameOver(ships: Ship[]): boolean {
  return ships.every((ship) => ship.isSunk);
}

export function getOpponentBoard(game: Game, playerRole: PlayerRole): Cell[][] {
  return playerRole === "player1" ? game.player2Board : game.player1Board;
}

export function getPlayerBoard(game: Game, playerRole: PlayerRole): Cell[][] {
  return playerRole === "player1" ? game.player1Board : game.player2Board;
}

export function getPlayerShips(game: Game, playerRole: PlayerRole): Ship[] {
  return playerRole === "player1" ? game.player1Ships : game.player2Ships;
}

export function getOpponentShips(game: Game, playerRole: PlayerRole): Ship[] {
  return playerRole === "player1" ? game.player2Ships : game.player1Ships;
}

export { BOARD_SIZE, SHIP_CONFIGS };
