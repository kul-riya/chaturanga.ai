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
import backgroundImage from "../assets/stary_night_image.png"

export default function ChessBoardComponentPvP({ isTimerOn = false, minutes = 5 }) {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [promotion, setPromotion] = useState(null);
  const [checkmateWinner, setCheckmateWinner] = useState(null);
  const [turn, setTurn] = useState("White");
  const [isCheck, setIsCheck] = useState(false);
  const [moves, setMoves] = useState([]);
  const [timerWinner, setTimerWinner] = useState(null);
  const [whiteTime, setWhiteTime] = useState(minutes * 60);
  const [blackTime, setBlackTime] = useState(minutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerEnded, setTimerEnded] = useState(false);

  const pieceIcons = { q: FaChessQueen, r: FaChessRook, b: FaChessBishop, n: FaChessKnight };

  const [boardWidth, setBoardWidth] = useState(Math.min(window.innerWidth * 0.8, 420));

  useEffect(() => {
    const handleResize = () => setBoardWidth(Math.min(window.innerWidth * 0.8, 420));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);




  // Timer logic
  useEffect(() => {
    if (!isTimerOn || checkmateWinner || timerEnded) return;

    const interval = setInterval(() => {
      if (!timerRunning) return;
      if (chessGame.turn() === "w") {
        setWhiteTime(prev => {
          if (prev <= 1) { handleTimerEnd("Black"); return 0; }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) { handleTimerEnd("White"); return 0; }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerOn, timerRunning, checkmateWinner, timerEnded]);

  const handleTimerEnd = (winnerColor) => {
    setTimerWinner(winnerColor);
    setTimerEnded(true);
    setTimerRunning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getMoveOptions = (square) => {
    const mv = chessGame.moves({ square, verbose: true });
    if (mv.length === 0) { 
      setOptionSquares({}); 
      return false; 
    }
    const newSquares = {};
    for (const move of mv) {
      newSquares[move.to] = {
        background: chessGame.get(move.to) && chessGame.get(move.to).color !== chessGame.get(square).color
          ? "radial-gradient(circle, rgba(255, 255, 150, 0.8) 85%, transparent 85%)" // capture square
          : "radial-gradient(circle, rgba(255, 255, 150, 0.6) 25%, transparent 25%)", // normal move
        borderRadius: "50%",
      };
    }
    newSquares[square] = { background: "rgba(255, 255, 150, 0.4)" }; // selected square
    setOptionSquares(newSquares);
    return true;
  };


  const handleMove = (from, to, promotionPiece = "q") => {
    try {
      const move = chessGame.move({ from, to, promotion: promotionPiece });
      if (move) {
        const moveNotation = `${move.from}-${move.to}`;
        setMoves(prev => {
          const lastMove = prev[prev.length - 1] || {};
          if (chessGame.turn() === "b") {
            return [...prev.slice(0, -1), { ...lastMove, white: { san: move.san, notation: moveNotation } }];
          } else {
            return [...prev, { black: { san: move.san, notation: moveNotation } }];
          }
        });
      }
      setChessPosition(chessGame.fen());
      setMoveFrom("");
      setOptionSquares({});
      checkGameOver();
      setTurn(chessGame.turn() === "w" ? "White" : "Black");
      if (isTimerOn) setTimerRunning(true);
    } catch { setMoveFrom(""); setOptionSquares({}); }
  };

  const checkGameOver = () => {
    if (chessGame.isCheckmate()) {
      setCheckmateWinner(chessGame.turn() === "w" ? "Black" : "White");
    }
    setIsCheck(chessGame.inCheck());
  };

  const restartGame = () => {
    const newGame = new Chess();
    chessGameRef.current = newGame;
    setChessPosition(newGame.fen());
    setMoveFrom("");
    setOptionSquares({});
    setIsCheck(false);
    setTurn("White");
    setMoves([]);
    setCheckmateWinner(null);
    setTimerWinner(null);
    setTimerEnded(false);
    setTimerRunning(false);
    if (isTimerOn) { setWhiteTime(minutes * 60); setBlackTime(minutes * 60); }
  };

  const onSquareClick = ({ square, piece }) => {
    if (promotion || checkmateWinner || (isTimerOn && timerEnded)) return;
    if (!moveFrom && piece) { const hasMoveOptions = getMoveOptions(square); if (hasMoveOptions) setMoveFrom(square); return; }
    const mv = chessGame.moves({ square: moveFrom, verbose: true });
    const foundMove = mv.find(m => m.from === moveFrom && m.to === square);
    if (!foundMove) { const hasMoveOptions = getMoveOptions(square); setMoveFrom(hasMoveOptions ? square : ""); return; }
    if (foundMove.promotion) { setPromotion({ from: moveFrom, to: square }); return; }
    handleMove(moveFrom, square);
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }) => {
    if (checkmateWinner || (isTimerOn && timerEnded)) return false;
    const mv = chessGame.moves({ square: sourceSquare, verbose: true });
    const foundMove = mv.find(m => m.from === sourceSquare && m.to === targetSquare);
    if (!foundMove) return false;
    if (foundMove.promotion) { setPromotion({ from: sourceSquare, to: targetSquare }); return false; }
    handleMove(sourceSquare, targetSquare);
    return true;
  };

  const choosePromotion = (piece) => { if (promotion) { handleMove(promotion.from, promotion.to, piece); setPromotion(null); } };
  const chessboardOptions = { onPieceDrop, onSquareClick, position: chessPosition, squareStyles: optionSquares, id: "pvp-board" };

  const renderMovesTable = () => moves.map((move, i) => (
    <tr key={i}>
      <td style={{ padding: "4px 8px", textAlign: "right", width: "30px" }}>{i + 1}.</td>
      <td style={{ padding: "4px 8px", minWidth: "90px", color: "#4ea6ff" }}>{move.white && <div>
        <div>{move.white.san}</div>
        <div style={{ fontSize: "12px", color: "#ccc" }}>{move.white.notation}</div>
      </div>}</td>
      <td style={{ padding: "4px 8px", minWidth: "90px", color: "#ff4d4d" }}>{move.black && <div>
        <div>{move.black.san}</div>
        <div style={{ fontSize: "12px", color: "#ccc" }}>{move.black.notation}</div>
      </div>}</td>
    </tr>
  ));

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
        }}>
      {/* Chess & Controls */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ color: "#f5f0e1", fontSize: "20px", fontWeight: "bold" }}>
          Turn: <span style={{ color: turn === "White" ? "#4ea6ff" : "#ff4d4d" }}>{turn}</span>
        </div>

        {isTimerOn && !timerEnded && <button
          onClick={() => setTimerRunning(true)}
          disabled={timerRunning}
          style={{
            padding: "8px 16px",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "6px",
            border: "2px solid #f5f0e1",
            backgroundColor: timerRunning ? "#6c757d" : "#0d253f",
            color: "#f5f0e1",
            cursor: timerRunning ? "not-allowed" : "pointer",
          }}
        >⏳ Start Timer</button>}

        {isTimerOn && <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontWeight: "bold", color: "#f5f0e1", fontSize: "18px" }}>
          <div style={{ color: "#4ea6ff" }}>White: {formatTime(whiteTime)}</div>
          <div style={{ color: "#ff4d4d" }}>Black: {formatTime(blackTime)}</div>
        </div>}

        <div
          style={{
            border: isCheck ? "4px solid yellow" : "4px solid transparent",
            borderRadius: "12px",
            transition: "border-color 0.3s",
            boxShadow: isCheck
              ? "0 0 20px 4px rgba(255,255,0,0.6)"
              : "0 4px 12px rgba(0,0,0,0.4)",
            width: boardWidth,
            height: boardWidth,
            margin: "auto",
          }}
        >
          <Chessboard options={chessboardOptions} boardWidth={boardWidth} />
        </div>



        <button onClick={restartGame} style={{
          padding: "6px 12px",
          marginTop: "6px",
          cursor: "pointer",
          borderRadius: "6px",
          backgroundColor: "#0d253f",
          color: "#f5f0e1",
          border: "2px solid #f5f0e1"
        }}>Restart</button>
      </div>

      {/* Moves Panel */}
      <div style={{
        width: "220px",
        height: "480px",
        overflowY: "auto",
        backgroundColor: "rgba(245,240,225,0.1)",
        borderRadius: "10px",
        padding: "12px",
        fontFamily: "monospace",
        color: "#f5f0e1",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "8px" }}>Moves</h3>
        {moves.length === 0 ? <div style={{ textAlign: "center", color: "#ccc" }}>No moves yet</div> :
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>{renderMovesTable()}</tbody></table>}
      </div>

      {/* Promotion Dialog */}
      {promotion && (
        <div style={{
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
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}>
          <p style={{ marginBottom: "10px", fontWeight: "bold", color: "#ff4d4d" }}>Choose Promotion</p>
          <div style={{ display: "flex", gap: "15px" }}>
            {["q", "r", "b", "n"].map(piece => {
              const Icon = pieceIcons[piece];
              return (
                <button key={piece} onClick={() => choosePromotion(piece)} style={{
                  border: "2px solid #ff4d4d",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#ffe6e6",
                  cursor: "pointer",
                  fontSize: "28px"
                }}>
                  <Icon />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isTimerOn && timerEnded && timerWinner && <TimerEndDialog winner={timerWinner} onRestart={restartGame} />}
      {(!isTimerOn || !timerEnded) && checkmateWinner && <CheckmateDialog winner={checkmateWinner} onRestart={restartGame} />}
    </div>
  );
}
