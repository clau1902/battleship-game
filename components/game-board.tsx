"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Cell, CellStatus } from "@/types/game";
import { BOARD_SIZE } from "@/lib/game-logic";

interface GameBoardProps {
  board: Cell[][];
  onCellClick?: (row: number, col: number) => void;
  showShips?: boolean;
  disabled?: boolean;
  title?: string;
}

export function GameBoard({
  board,
  onCellClick,
  showShips = false,
  disabled = false,
  title,
}: GameBoardProps) {
  const getCellColor = (status: CellStatus): string => {
    switch (status) {
      case "empty":
        return "bg-blue-100 hover:bg-blue-200 border-blue-300";
      case "ship":
        return showShips
          ? "bg-gray-600 border-gray-700"
          : "bg-blue-100 hover:bg-blue-200 border-blue-300";
      case "hit":
        return "bg-red-500 border-red-600";
      case "miss":
        return "bg-gray-400 border-gray-500";
      case "sunk":
        return "bg-red-800 border-red-900";
      default:
        return "bg-blue-100 border-blue-300";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}
      <div className="grid grid-cols-11 gap-0 border-2 border-gray-800 bg-gray-50 p-2 rounded-lg">
        {/* Column headers */}
        <div className="col-span-1"></div>
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <div
            key={`col-${i}`}
            className="flex items-center justify-center font-bold text-sm text-gray-700 w-8 h-8"
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}

        {/* Rows */}
        {board.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {/* Row header */}
            <div className="flex items-center justify-center font-bold text-sm text-gray-700 w-8 h-8">
              {rowIndex + 1}
            </div>
            {/* Cells */}
            {row.map((cell, colIndex) => (
              <button
                key={`cell-${rowIndex}-${colIndex}`}
                onClick={() => !disabled && onCellClick?.(rowIndex, colIndex)}
                disabled={disabled || cell.status === "hit" || cell.status === "miss"}
                className={cn(
                  "w-8 h-8 border-2 transition-colors",
                  getCellColor(cell.status),
                  !disabled &&
                    (cell.status === "empty" || (showShips && cell.status === "ship"))
                    ? "cursor-pointer hover:scale-110"
                    : "cursor-not-allowed"
                )}
                aria-label={`Cell ${String.fromCharCode(65 + colIndex)}${rowIndex + 1}, ${cell.status}`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

