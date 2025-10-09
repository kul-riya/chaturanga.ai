import React, { useRef, useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import {
  FaChessQueen,
  FaChessRook,
  FaChessBishop,
  FaChessKnight,
} from "react-icons/fa";
import CheckmateDialog from "./CheckmateDialog";
import TimerEndDialog from "./TimerEndDialog";

export default function ChessBoardComponentPvP({ isTimerOn = false, minutes = 5 }) {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [promotion, setPromotion] = useState(null);
  const [checkmateWinner, setcheckmateWinner] = useState(null);
  const [turn, setTurn] = useState("White");
  const [isCheck, setIsCheck] = useState(false);

  const [timerWinner, setTimerWinner] = useState(null);
  const [whiteTime, setWhiteTime] = useState(minutes * 60);
  const [blackTime, setBlackTime] = useState(minutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerEnded, setTimerEnded] = useState(false);

  useEffect(() => {
    if (!isTimerOn || checkmateWinner || timerEnded) return;

    const interval = setInterval(() => {
      setTimerRunning((prev) => {
        if (!prev) return prev;
        if (chessGame.turn() === "w") {
          setWhiteTime((prevTime) => {
            if (prevTime <= 1) {
              handleTimerEnd("Black");
              return 0;
            }
            return prevTime - 1;
          });
        } else {
          setBlackTime((prevTime) => {
            if (prevTime <= 1) {
              handleTimerEnd("White");
              return 0;
            }
            return prevTime - 1;
          });
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerOn, checkmateWinner, timerEnded]);

  function handleTimerEnd(winnerColor) {
    if (!isTimerOn) return;
    setTimerWinner(winnerColor);
    setTimerEnded(true);
    setTimerRunning(false);
  }


  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  const pieceIcons = {
    q: FaChessQueen,
    r: FaChessRook,
    b: FaChessBishop,
    n: FaChessKnight,
  };

  function getMoveOptions(square) {
    const moves = chessGame.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares = {};
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to) &&
          chessGame.get(move.to)?.color !== chessGame.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }

    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
    setOptionSquares(newSquares);
    return true;
  }

  function handleMove(from, to, promotionPiece = "q") {
    try {
      chessGame.move({ from, to, promotion: promotionPiece });
      setChessPosition(chessGame.fen());
      setMoveFrom("");
      setOptionSquares({});
      checkGameOver();
      setTurn(chessGame.turn() === "w" ? "White" : "Black");
    } catch {
      setMoveFrom("");
      setOptionSquares({});
    }
    if (isTimerOn) {
      setTimerRunning(true);
    }

  }

  function checkGameOver() {
    if (chessGame.isCheckmate()) {
      setcheckmateWinner(chessGame.turn() === "w" ? "Black" : "White");
    }
    setIsCheck(chessGame.inCheck());
  }

  function restartGame() {
    const newGame = new Chess();
    chessGameRef.current = newGame;
    setChessPosition(newGame.fen());
    setMoveFrom("");
    setOptionSquares({});
    setIsCheck(false);
    setTurn("White");
    setTimerRunning(false);

    // Reset all result states
    setcheckmateWinner(null);
    setTimerWinner(null);
    setTimerEnded(false);

  // reset timers if enabled
    if (isTimerOn) {
      setWhiteTime(minutes * 60);
      setBlackTime(minutes * 60);
      setTimerRunning(false);
    }
  }


  function onSquareClick({ square, piece }) {
    // Prevent moves during promotion, after checkmate, or after timer ended
    if (promotion || checkmateWinner || (isTimerOn && timerEnded)) return;

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
  }


  function onPieceDrop({ sourceSquare, targetSquare }) {
    // Prevent moves after checkmate or timer ended
    if (checkmateWinner || (isTimerOn && timerEnded)) return false;

    if (!targetSquare) return false;

    const moves = chessGame.moves({ square: sourceSquare, verbose: true });
    const foundMove = moves.find(
      (m) => m.from === sourceSquare && m.to === targetSquare
    );

    if (!foundMove) return false;

    if (foundMove.promotion) {
      setPromotion({ from: sourceSquare, to: targetSquare });
      return false;
    }

    handleMove(sourceSquare, targetSquare);
    return true;
  }


  function choosePromotion(piece) {
    if (promotion) {
      handleMove(promotion.from, promotion.to, piece);
      setPromotion(null);
    }
  }

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    squareStyles: optionSquares,
    id: "pvp-board",
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Turn indicator */}
      <div style={{ marginBottom: "10px", fontWeight: "bold", fontSize: "18px" }}>
        Turn: <span style={{ color: turn === "White" ? "#007bff" : "#e63946" }}>{turn}</span>
      </div>

      {/** Timer start button */}
      {isTimerOn && !timerEnded && (
        <button
          onClick={() => setTimerRunning(true)}
          disabled={timerRunning} // disables after first click
          style={{
            marginBottom: "10px",
            padding: "8px 16px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: timerRunning ? "#6c757d" : "#007bff", // gray if disabled
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: timerRunning ? "not-allowed" : "pointer",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            transition: "background-color 0.2s",
          }}
        >
          Start Timer
        </button>
      )}


      {/** timer display */}
      {isTimerOn && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          width: "300px",
          marginBottom: "10px",
          fontWeight: "bold",
          fontSize: "18px",
        }}>
          <div style={{ color: "#007bff" }}>White: {formatTime(whiteTime)}</div>
          <div style={{ color: "#e63946" }}>Black: {formatTime(blackTime)}</div>
        </div>
      )}


      <div
        style={{
          border: isCheck ? "4px solid yellow" : "4px solid transparent",
          borderRadius: "12px",
          transition: "border-color 0.3s ease",
          boxShadow: isCheck ? "0 0 15px 4px rgba(255, 255, 0, 0.6)" : "none",
        }}
      >
        <Chessboard options={chessboardOptions} />
      </div>

      {/* Promotion dialog */}
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
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <p
            style={{
              marginBottom: "10px",
              fontWeight: "bold",
              color: "#ff4d4d",
            }}
          >
            Choose Promotion
          </p>
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
                    transition: "transform 0.2s, background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <Icon />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Timer-based result (only if timer is on) */}
      {isTimerOn && timerEnded && timerWinner && (
        <TimerEndDialog
          winner={timerWinner}
          onRestart={restartGame}
        />
      )}


      {/* Normal checkmate result (show only if timer hasn’t ended) */}
      {(!isTimerOn || !timerEnded) && checkmateWinner && (
        <CheckmateDialog winner={checkmateWinner} onRestart={restartGame} />
      )}


    </div>
  );
}
