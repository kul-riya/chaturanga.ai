import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessBoardComponent() {
    
  const [game, setGame] = useState(new Chess());
  const [boardWidth, setBoardWidth] = useState(400);
  const containerRef = useRef(null);

  const handleMove = (sourceSquare, targetSquare) => {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
    if (!move) return;
    setGame(new Chess(game.fen()));
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setBoardWidth(width);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "90vw",
        maxWidth: "600px",
        margin: "20px auto",
      }}
    >
      <Chessboard
        id="Chessboard"
        position={game.fen()}
        onPieceDrop={handleMove}
        boardWidth={boardWidth}
      />
    </div>
  );
}
