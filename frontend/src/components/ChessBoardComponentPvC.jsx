import React, { useRef, useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { FaChessQueen, FaChessRook, FaChessBishop, FaChessKnight } from "react-icons/fa";
import CheckmateDialog from "./CheckmateDialog";
import backgroundImage from "../assets/stary_night_image.png";

export default function ChessBoardComponentPvC({ playerColour }) {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [promotion, setPromotion] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isCheck, setIsCheck] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState(playerColour);
  const [redoStack, setRedoStack] = useState([]);
  const [moveList, setMoveList] = useState([]);

  const [boardWidth, setBoardWidth] = useState(Math.min(window.innerWidth * 0.8, 420));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const pieceIcons = { q: FaChessQueen, r: FaChessRook, b: FaChessBishop, n: FaChessKnight };

  useEffect(() => {
    const handleResize = () => {
      setBoardWidth(Math.min(window.innerWidth * 0.8, 420));
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const makeRandomMove = () => {
    const possibleMoves = chessGame.moves();
    if (chessGame.isGameOver() || possibleMoves.length === 0) {
      checkGameOver();
      return;
    }
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    const move = chessGame.move(randomMove);
    if (move) setMoveList((prev) => [...prev, formatMove(move)]);
    setChessPosition(chessGame.fen());
    checkGameOver();
  };

  const getMoveOptions = (square) => {
    const moves = chessGame.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares = {};
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to) && chessGame.get(move.to).color !== chessGame.get(square).color
            ? "radial-gradient(circle, rgba(255, 255, 150, 0.8) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(255, 255, 150, 0.6) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }
    newSquares[square] = { background: "rgba(255, 255, 150, 0.4)" };
    setOptionSquares(newSquares);
    return true;
  };

  const formatMove = (move) => `${move.from}-${move.to}${move.promotion ? `=${move.promotion}` : ""}`;

  const handleMove = (from, to, promotionPiece = "q") => {
    try {
      const move = chessGame.move({ from, to, promotion: promotionPiece });
      if (move) setMoveList((prev) => [...prev, formatMove(move)]);

      setChessPosition(chessGame.fen());
      setMoveFrom("");
      setOptionSquares({});
      checkGameOver();
      setRedoStack([]);

      if (!chessGame.isGameOver()) setTimeout(makeRandomMove, 300);
    } catch {
      setMoveFrom("");
      setOptionSquares({});
    }
  };

  const undoMove = () => {
    const history = chessGame.history({ verbose: true });
    if (history.length === 0) return;

    const movesToUndo = history.length >= 2 ? 2 : 1;
    const undoneMoves = [];

    for (let i = 0; i < movesToUndo; i++) {
      const move = chessGame.undo();
      if (move) undoneMoves.unshift(move);
    }

    if (undoneMoves.length > 0) {
      setRedoStack((prev) => [...prev, ...undoneMoves]);
      setMoveList((prev) => prev.slice(0, prev.length - undoneMoves.length));
      setChessPosition(chessGame.fen());
      setWinner(null);
      setIsCheck(chessGame.inCheck());
    }
  };

  const redoMove = () => {
    if (redoStack.length === 0) return;
    const movesCopy = [...redoStack];
    const movesToRedo = movesCopy.length >= 2 ? 2 : 1;
    const redoneMoves = movesCopy.slice(-movesToRedo);

    for (const move of redoneMoves) chessGame.move(move);

    setRedoStack(movesCopy.slice(0, movesCopy.length - movesToRedo));
    setMoveList((prev) => [...prev, ...redoneMoves.map(formatMove)]);
    setChessPosition(chessGame.fen());
    setIsCheck(chessGame.inCheck());
  };

  const checkGameOver = () => {
    if (chessGame.isCheckmate()) setWinner(chessGame.turn() === "w" ? "Black" : "White");
    setIsCheck(chessGame.inCheck());
  };

  const restartGame = () => {
    const newGame = new Chess();
    chessGameRef.current = newGame;
    setWinner(null);
    setMoveList([]);
    setRedoStack([]);
    setChessPosition(newGame.fen());
  };

  const onSquareClick = ({ square, piece }) => {
    if (promotion) return;
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }
    const moves = chessGame.moves({ square: moveFrom, verbose: true });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);
    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : "");
      return;
    }
    if (foundMove.promotion) {
      setPromotion({ from: moveFrom, to: square });
      return;
    }
    handleMove(moveFrom, square);
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }) => {
    if (!targetSquare) return false;
    const moves = chessGame.moves({ square: sourceSquare, verbose: true });
    const foundMove = moves.find((m) => m.from === sourceSquare && m.to === targetSquare);
    if (!foundMove) return false;
    if (foundMove.promotion) {
      setPromotion({ from: sourceSquare, to: targetSquare });
      return false;
    }
    handleMove(sourceSquare, targetSquare);
    return true;
  };

  const choosePromotion = (piece) => {
    if (promotion) {
      handleMove(promotion.from, promotion.to, piece);
      setPromotion(null);
    }
  };

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    squareStyles: optionSquares,
    boardOrientation,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "center",
        alignItems: isMobile ? "center" : "flex-start",
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: "#162447",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        gap: "30px",
      }}
    >
      {/* Chessboard & Controls */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            border: isCheck ? "4px solid yellow" : "4px solid transparent",
            borderRadius: "12px",
            transition: "border-color 0.3s ease",
            boxShadow: isCheck ? "0 0 20px 4px rgba(255,255,0,0.6)" : "0 4px 12px rgba(0,0,0,0.4)",
            width: boardWidth,
            height: boardWidth,
            margin: "auto",
          }}
        >
          <Chessboard options={chessboardOptions} boardWidth={boardWidth} />
        </div>

        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          <button onClick={undoMove} disabled={chessGame.history().length === 0}>
            Undo
          </button>
          <button onClick={redoMove} disabled={redoStack.length === 0}>
            Redo
          </button>
          <button onClick={restartGame}>Restart</button>
        </div>
      </div>

      {/* Move list panel */}
      <div
        style={{
          width: "220px",
          height: "480px",
          overflowY: "auto",
          backgroundColor: "rgba(245,240,225,0.1)",
          borderRadius: "10px",
          padding: "12px",
          fontFamily: "monospace",
          color: "#f5f0e1",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "8px" }}>Moves</h3>
        {moveList.length === 0 ? (
          <div style={{ textAlign: "center", color: "#ccc" }}>No moves yet</div>
        ) : (
          <ol style={{ paddingLeft: "20px" }}>
            {moveList.map((mv, idx) => (
              <li key={idx}>{mv}</li>
            ))}
          </ol>
        )}
      </div>

      {/* Promotion Dialog */}
      {promotion && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fef9f9",
            border: "2px solid #ff4d4d",
            borderRadius: "12px",
            padding: "15px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <p style={{ marginBottom: "10px", fontWeight: "bold", color: "#ff4d4d" }}>Choose Promotion</p>
          <div style={{ display: "flex", gap: "15px" }}>
            {["q", "r", "b", "n"].map((piece) => {
              const Icon = pieceIcons[piece];
              return (
                <button
                  key={piece}
                  onClick={() => choosePromotion(piece)}
                  style={{
                    border: "2px solid #ff4d4d",
                    borderRadius: "8px",
                    padding: "10px",
                    backgroundColor: "#ffe6e6",
                    cursor: "pointer",
                    fontSize: "28px",
                  }}
                >
                  <Icon />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {winner && <CheckmateDialog winner={winner} onRestart={restartGame} />}
    </div>
  );
}
