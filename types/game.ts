export type CellStatus = "empty" | "ship" | "hit" | "miss" | "sunk";

export type ShipType = "carrier" | "battleship" | "cruiser" | "submarine" | "destroyer";

export interface Ship {
  type: ShipType;
  length: number;
  positions: Array<{ row: number; col: number }>;
  isSunk: boolean;
}

export interface Cell {
  row: number;
  col: number;
  status: CellStatus;
  shipId?: string;
}

export type GameStatus = "waiting" | "placing" | "playing" | "finished";

export type PlayerRole = "player1" | "player2";

export type GameScreen = "auth" | "welcome" | "setup" | "placing" | "battle" | "results";

export interface Game {
  _id?: string;
  player1Id: string;
  player2Id?: string;
  currentTurn: PlayerRole;
  status: GameStatus;
  player1Board: Cell[][];
  player2Board: Cell[][];
  player1Ships: Ship[];
  player2Ships: Ship[];
  player1Ready: boolean;
  player2Ready: boolean;
  winner?: PlayerRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttackResult {
  hit: boolean;
  sunk: boolean;
  shipType?: ShipType;
  gameStatus: GameStatus;
  winner?: PlayerRole;
}
