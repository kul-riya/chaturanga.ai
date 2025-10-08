import React, { useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { FaChessQueen, FaChessRook, FaChessBishop, FaChessKnight } from "react-icons/fa";
import CheckmateDialog from "./CheckmateDialog";

export default function ChessBoardComponentPvC() {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [promotion, setPromotion] = useState(null);
  const [winner, setWinner] = useState(null); 

  const pieceIcons = {
    q: FaChessQueen,
    r: FaChessRook,
    b: FaChessBishop,
    n: FaChessKnight,
  };

  function makeRandomMove() {
    const possibleMoves = chessGame.moves();
    if (chessGame.isGameOver() || possibleMoves.length === 0) {
      checkGameOver();
      return;
    }

    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    chessGame.move(randomMove);
    setChessPosition(chessGame.fen());
    checkGameOver();
  }

  function getMoveOptions(square) {
    const moves = chessGame.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares = {};
    for (const move of moves) {
      newSquares[move.to] = {
        background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%'
      };
    }

    newSquares[square] = { background: 'rgba(255, 255, 0, 0.4)' };
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

      // make random move if game not over
      if (!chessGame.isGameOver()) setTimeout(makeRandomMove, 300);
    } catch {
      setMoveFrom("");
      setOptionSquares({});
    }
  }

    function checkGameOver() {
    if (chessGame.isCheckmate()) {
      setWinner(chessGame.turn() === "w" ? "Black" : "White");
    }
  }

  function restartGame() {
    const newGame = new Chess();
    chessGameRef.current = newGame;
    setWinner(null);
    setChessPosition(newGame.fen());
  }

  function onSquareClick({ square, piece }) {
    // handle promotion first
    if (promotion) return;

    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    const moves = chessGame.moves({ square: moveFrom, verbose: true });
    const foundMove = moves.find(m => m.from === moveFrom && m.to === square);
    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : '');
      return;
    }

    // check if pawn promotion
    if (foundMove.promotion) {
      setPromotion({ from: moveFrom, to: square });
      return;
    }

    handleMove(moveFrom, square);
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare) return false;

    const moves = chessGame.moves({ square: sourceSquare, verbose: true });
    const foundMove = moves.find(m => m.from === sourceSquare && m.to === targetSquare);

    if (!foundMove) return false;

    if (foundMove.promotion) {
      setPromotion({ from: sourceSquare, to: targetSquare });
      return false; // wait for promotion choice
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
    id: 'click-or-drag-to-move'
  };

  return (
    <div style={{ position: 'relative' }}>
      <Chessboard options={chessboardOptions} />

      {/* Promotion dialog */}
      {promotion && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fef9f9',
            border: '2px solid #ff4d4d',
            borderRadius: '12px',
            padding: '15px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <p style={{ marginBottom: '10px', fontWeight: 'bold', color: '#ff4d4d' }}>
            Choose Promotion
          </p>
          <div style={{ display: 'flex', gap: '15px' }}>
            {['q', 'r', 'b', 'n'].map(piece => {
              const Icon = pieceIcons[piece];
              return (
                <button
                  key={piece}
                  onClick={() => choosePromotion(piece)}
                  style={{
                    border: '2px solid #ff4d4d',
                    borderRadius: '8px',
                    padding: '10px',
                    backgroundColor: '#ffe6e6',
                    cursor: 'pointer',
                    fontSize: '28px',
                    transition: 'transform 0.2s, background-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Icon />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Checkmate dialog */}
      {winner && <CheckmateDialog winner={winner} onRestart={restartGame} />}

    </div>
  );
}
