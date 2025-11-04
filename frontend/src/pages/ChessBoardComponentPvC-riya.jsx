import React, { useRef, useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { FaChessQueen, FaChessRook, FaChessBishop, FaChessKnight } from "react-icons/fa";
import CheckmateDialog from "../components/CheckmateDialog";
import backgroundImage from "../assets/stary_night_image.png";
import { useNavigate } from "react-router-dom";
import { createPlayer, createGame, recordMove, updateGameResult, updateGameOpening, findOrCreateOpening, getPlayer, ensureComputerPlayer } from "../services/api";
import { chessEngineService } from '../services/chessEngineService';

export default function ChessBoardComponentPvC({ playerColour = "white" }) {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const navigate = useNavigate();

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [promotion, setPromotion] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isCheck, setIsCheck] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState(playerColour);
  const [boardRotation, setBoardRotation] = useState(0);
  const [redoStack, setRedoStack] = useState([]);
  const [moveList, setMoveList] = useState([]);

  // Player and Game states
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const COMPUTER_PLAYER_ID = 1; // Fixed computer player ID
  const [currentGameId, setCurrentGameId] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [showPlayerSetup, setShowPlayerSetup] = useState(true);
  const [openingDetected, setOpeningDetected] = useState(false);
  const [computerPlayerReady, setComputerPlayerReady] = useState(false);

  const [boardWidth, setBoardWidth] = useState(Math.min(window.innerWidth * 0.8, 420));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [engineReady, setEngineReady] = useState(false);
  const [engineThinking, setEngineThinking] = useState(false);
  const [engineError, setEngineError] = useState(null);
  const [positionEval, setPositionEval] = useState(0);

  const pieceIcons = { q: FaChessQueen, r: FaChessRook, b: FaChessBishop, n: FaChessKnight };

  const humanColor = playerColour[0];
  const computerColor = humanColor === "w" ? "b" : "w";


  useEffect(() => {
    const handleResize = () => {
      setBoardWidth(Math.min(window.innerWidth * 0.8, 420));
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ensure computer player (ID 1) exists ONCE on mount
  useEffect(() => {
    const ensureComputer = async () => {
      try {
        await ensureComputerPlayer();
        setComputerPlayerReady(true);
        console.log("Computer player ready (ID: 1)");
      } catch (error) {
        console.error("Error ensuring computer player exists:", error);
        setComputerPlayerReady(true); // Continue anyway
      }
    };
    ensureComputer();
  }, []);


  // Check engine health on mount
  useEffect(() => {
    const checkEngine = async () => {
      const isReady = await chessEngineService.checkHealth();
      setEngineReady(isReady);
      if (!isReady) {
        setEngineError('Chess engine server not running. Using random moves as fallback.');
        console.warn('Chess engine offline - falling back to random moves');
      } else {
        setEngineError(null);
        console.log('Chess engine ready');
      }
    };
    
    checkEngine();
    
    // Check health every 30 seconds
    const interval = setInterval(checkEngine, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeGame = async (humanPlayerId) => {
    try {
      const whiteId = playerColour === "white" ? parseInt(humanPlayerId) : COMPUTER_PLAYER_ID;
      const blackId = playerColour === "black" ? parseInt(humanPlayerId) : COMPUTER_PLAYER_ID;
      
      console.log("Creating game with:", { whiteId, blackId, humanPlayerId });
      
      if (!whiteId || !blackId || whiteId <= 0 || blackId <= 0) {
        console.error("Invalid player IDs:", { whiteId, blackId, humanPlayerId });
        throw new Error("Invalid player IDs");
      }
      
      const response = await createGame(whiteId, blackId, "*");
      console.log(response.data);
      
      if (response.success && response.data && response.data.id) {
        setCurrentGameId(response.data.id);
        setMoveCount(0);
        console.log("Game created with ID:", response.data.id);
        return response.data.id;
      } else {
        console.error("Failed to create game:", response);
        throw new Error(response.error || "Failed to create game");
      }
    } catch (error) {
      console.error("Error initializing game:", error);
      throw error;
    }
  };

  const handleSavePlayer = async () => {
    if (!computerPlayerReady) {
      alert("Please wait, setting up computer player...");
      return;
    }

    let humanId = (playerId || "").trim();

    try {
      // If ID is provided, validate it exists
      if (humanId && !isNaN(humanId)) {
        const id = parseInt(humanId);
        if (id === COMPUTER_PLAYER_ID) {
          alert("Cannot use ID 1 - that's reserved for the computer player!");
          return;
        }
        
        // Verify player exists
        try {
          const playerResponse = await getPlayer(id);
          if (!playerResponse.success) {
            alert(`Player ID ${id} not found. Please create a new player by entering a name.`);
            return;
          }
          humanId = id.toString();
          console.log("Using existing player:", id);
        } catch (error) {
          alert(`Player ID ${id} not found. Please create a new player by entering a name.`);
          return;
        }
      } else {
        // Create new player with provided name
        const nameToUse = (playerName || humanId || `Player ${Date.now()}`).trim();
        if (!nameToUse) {
          alert("Please provide a player name");
          return;
        }
        
        console.log("Creating new player:", nameToUse);
        const response = await createPlayer(nameToUse);
        if (response.success && response.data && response.data.id) {
          humanId = response.data.id.toString();
          console.log("Created new player with ID:", humanId);
        } else {
          throw new Error("Failed to create player");
        }
      }
      
      // Validate final ID
      if (isNaN(humanId) || parseInt(humanId) <= 0) {
        throw new Error("Invalid player ID");
      }

      setPlayerId(humanId);
      setShowPlayerSetup(false);
      
      // Initialize game
      await initializeGame(humanId);
      
    } catch (error) {
      console.error("Error in handleSavePlayer:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const formatMove = (move) => `${move.from}-${move.to}${move.promotion ? `=${move.promotion}` : ""}`;

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

  const detectAndSaveOpening = async () => {
    if (openingDetected || !currentGameId) return;
    
    const history = chessGame.history();
    if (history.length < 4) return;
    
    try {
      const openingMoves = history.slice(0, Math.min(6, history.length));
      const moveSequence = openingMoves.join(" ");
      
      const response = await findOrCreateOpening(moveSequence);
      if (response.success && response.data && response.data.id) {
        await updateGameOpening(currentGameId, response.data.id);
        setOpeningDetected(true);
        console.log("Opening detected:", response.data.name || moveSequence);
      }
    } catch (error) {
      console.error("Error detecting/saving opening:", error);
    }
  };

  const checkGameOver = async () => {
    if (chessGame.isCheckmate()) {
      const winner = chessGame.turn() === "w" ? "Black" : "White";
      setWinner(winner);
      
      if (currentGameId) {
        const result = winner === "White" ? "1-0" : "0-1";
        try {
          await updateGameResult(currentGameId, result);
          await recordMove({
            game_id: currentGameId,
            fen: chessGame.fen(),
            move_number: moveCount + 1,
            move_notation: "game-end",
            from_square: "",
            to_square: "",
            is_check: true,
            winner: winner,
            promotion: null,
          });
        } catch (error) {
          console.error("Error updating game result:", error);
        }
      }
    }
    setIsCheck(chessGame.inCheck());
  };

  const recordMoveToDatabase = async (move, newMoveNumber) => {
    if (!currentGameId) {
      console.warn("No game ID, skipping database record");
      return;
    }

    const moveNotation = formatMove(move);
    
    try {
      await recordMove({
        game_id: currentGameId,
        fen: chessGame.fen(),
        move_number: newMoveNumber,
        move_notation: moveNotation,
        from_square: move.from,
        to_square: move.to,
        is_check: chessGame.inCheck(),
        winner: null,
        promotion: move.promotion || null,
      });
      console.log(`Recorded move ${newMoveNumber}: ${moveNotation}`);
    } catch (error) {
      console.error("Error recording move:", error);
    }
  };

  const handleMove = async (from, to, promotionPiece = "q") => {
    const move = chessGame.move({ from, to, promotion: promotionPiece });
    if (!move) {
      console.error("Invalid move attempted:", from, to);
      return false;
    }

    console.log("Move made:", move);
    
    const newMoveNumber = moveCount + 1;
    setMoveCount(newMoveNumber);
    
    // Record to database
    await recordMoveToDatabase(move, newMoveNumber);
    
    // Update move list
    const moveNotation = formatMove(move);
    setMoveList((prev) => [...prev, moveNotation]);
    
    // Update position immediately
    setChessPosition(chessGame.fen());
    setMoveFrom("");
    setOptionSquares({});
    setPromotion(null);
    
    // Detect opening
    if (!openingDetected && chessGame.history().length >= 4) {
      detectAndSaveOpening();
    }
    
    // Check game state
    await checkGameOver();
    
    if (engineReady && chessGame.turn() !== computerColor) {
      await getPositionEvaluation();
    }

    return true;
  };

  const getPositionEvaluation = async () => {
    if (!engineReady || !currentGameId) return;
    
    try {
      const currentFen = chessGame.fen();
      const result = await chessEngineService.getBestMove(currentFen, 4);
      
      if (result && result.score !== undefined) {
        setPositionEval(result.score);
      }
    } catch (error) {
      console.error('Error getting position evaluation:', error);
    }
  };

  const onSquareClick = ({ square }) => {
    if (promotion || winner || !currentGameId) return;
    
    // Only allow human to move on their turn
    if (chessGame.turn() !== humanColor) {
      console.log("Not human's turn");
      return;
    }

    const piece = chessGame.get(square);

    // If no piece selected yet
    if (!moveFrom) {
      if (piece && piece.color === humanColor) {
        const hasMoveOptions = getMoveOptions(square);
        if (hasMoveOptions) {
          setMoveFrom(square);
          console.log("Selected piece at:", square);
        }
      }
      return;
    }

    // If clicking the same square, deselect
    if (moveFrom === square) {
      setMoveFrom("");
      setOptionSquares({});
      return;
    }

    // Try to make a move
    const moves = chessGame.moves({ square: moveFrom, verbose: true });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);
    
    if (!foundMove) {
      // If clicking another own piece, select it instead
      if (piece && piece.color === humanColor) {
        const hasMoveOptions = getMoveOptions(square);
        setMoveFrom(hasMoveOptions ? square : "");
      } else {
        setMoveFrom("");
        setOptionSquares({});
      }
      return;
    }

    // Handle promotion
    if (foundMove.promotion) {
      setPromotion({ from: moveFrom, to: square });
      return;
    }

    // Make the move
    handleMove(moveFrom, square);
  };

  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (!targetSquare || promotion || winner || !currentGameId || chessGame.turn() !== humanColor) {
      return false;
    }

    const moves = chessGame.moves({ square: sourceSquare, verbose: true });
    const foundMove = moves.find((m) => m.from === sourceSquare && m.to === targetSquare);
    
    if (!foundMove) return false;

    if (foundMove.promotion) {
      setPromotion({ from: sourceSquare, to: targetSquare });
      return false;
    }

    return handleMove(sourceSquare, targetSquare);
  };

  const choosePromotion = (piece) => {
    if (promotion) {
      handleMove(promotion.from, promotion.to, piece);
      setPromotion(null);
    }
  };

  // Computer move effect with engine integration
  useEffect(() => {
    if (winner || !currentGameId || chessGame.turn() !== computerColor) {
      return;
    }

    const makeComputerMove = async () => {
      setEngineThinking(true);
      
      let move = null;
      
      // Try to use engine if available
      if (engineReady) {
        try {
          const currentFen = chessGame.fen();
          const result = await chessEngineService.getBestMove(currentFen, 4);
          
          if (result && result.move) {
            // Parse engine move format (e.g., "e2e4" or "e7e8q")
            const engineMove = result.move;
            const from = engineMove.substring(0, 2);
            const to = engineMove.substring(2, 4);
            const promotion = engineMove.length > 4 ? engineMove[4] : undefined;
            
            console.log(`Engine move: ${engineMove}, Score: ${result.score}`);
            if (result.score !== undefined) {
              setPositionEval(result.score);
            }
            
            move = chessGame.move({ from, to, promotion });
            
            if (!move) {
              console.error('Engine returned invalid move, falling back to random');
            }
          }
        } catch (error) {
          console.error('Engine error:', error);
          setEngineError('Engine error - using random move');
        }
      }
      
      // Fallback to random move if engine failed or unavailable
      if (!move) {
        const possibleMoves = chessGame.moves();
        if (possibleMoves.length === 0) {
          setEngineThinking(false);
          return;
        }
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        move = chessGame.move(randomMove);
        console.log('Random move:', randomMove);
      }
      
      if (move) {
        console.log("Computer move:", move);
        
        const newMoveNumber = moveCount + 1;
        setMoveCount(newMoveNumber);
        
        // Record to database
        await recordMoveToDatabase(move, newMoveNumber);
        
        // Update move list
        const moveNotation = formatMove(move);
        setMoveList((prev) => [...prev, moveNotation]);
        
        // Update position immediately
        setChessPosition(chessGame.fen());
        setMoveFrom("");
        setOptionSquares({});
        
        // Detect opening
        if (!openingDetected && chessGame.history().length >= 4) {
          detectAndSaveOpening();
        }
        
        // Check game state
        await checkGameOver();
      }
      
      setEngineThinking(false);
    };

    const timeout = setTimeout(makeComputerMove, 500);
    return () => clearTimeout(timeout);
  }, [chessPosition, winner, currentGameId, computerColor, engineReady]);

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
      setMoveFrom("");
      setOptionSquares({});
      setMoveCount((prev) => prev - undoneMoves.length);
    }
  };

  const redoMove = () => {
    if (redoStack.length === 0) return;
    
    const movesCopy = [...redoStack];
    const movesToRedo = movesCopy.length >= 2 ? 2 : 1;
    const redoneMoves = movesCopy.slice(-movesToRedo);
    
    for (const move of redoneMoves) {
      chessGame.move(move);
    }
    
    setRedoStack(movesCopy.slice(0, movesCopy.length - movesToRedo));
    setMoveList((prev) => [...prev, ...redoneMoves.map(formatMove)]);
    setChessPosition(chessGame.fen());
    setIsCheck(chessGame.inCheck());
    setMoveFrom("");
    setOptionSquares({});
    setMoveCount((prev) => prev + movesToRedo);
  };

  const restartGame = async () => {
    const newGame = new Chess();
    chessGameRef.current = newGame;
    setWinner(null);
    setMoveList([]);
    setRedoStack([]);
    setChessPosition(newGame.fen());
    setMoveFrom("");
    setOptionSquares({});
    setMoveCount(0);
    setOpeningDetected(false);
    
    if (playerId && currentGameId) {
      await initializeGame(playerId);
    }
  };

  const rotate90 = () => setBoardRotation((prev) => (prev + 90) % 360);
  const rotate180 = () => setBoardRotation((prev) => (prev + 180) % 360);

  const chessboardOptions = { onPieceDrop, onSquareClick, position: chessPosition, squareStyles: optionSquares, boardOrientation };
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
        position: "relative",
      }}
    >
      {/* Player Setup Dialog */}
      {showPlayerSetup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(13, 37, 63, 0.95)",
              padding: "30px",
              borderRadius: "12px",
              border: "2px solid #f5f0e1",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h2 style={{ color: "#f5f0e1", marginBottom: "20px" }}>Player Setup</h2>
            <p style={{ color: "#f5f0e1", marginBottom: "15px", fontSize: "14px" }}>
              Computer is already Player ID 1. Enter your existing ID or create a new player.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ color: "#f5f0e1", display: "block", marginBottom: "5px" }}>
                  Your Player ID (existing player):
                </label>
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="Enter existing player ID"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #f5f0e1",
                    backgroundColor: "rgba(245, 240, 225, 0.1)",
                    color: "#f5f0e1",
                  }}
                />
              </div>
              <div>
                <label style={{ color: "#f5f0e1", display: "block", marginBottom: "5px" }}>
                  OR create new player with name:
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter name for new player"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #f5f0e1",
                    backgroundColor: "rgba(245, 240, 225, 0.1)",
                    color: "#f5f0e1",
                  }}
                />
              </div>
              <button
                onClick={handleSavePlayer}
                disabled={!computerPlayerReady}
                style={{
                  padding: "10px 20px",
                  backgroundColor: computerPlayerReady ? "#e94560" : "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: computerPlayerReady ? "pointer" : "not-allowed",
                  fontSize: "16px",
                }}
              >
                {computerPlayerReady ? "Start Game" : "Setting up..."}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "8px 14px",
          backgroundColor: "rgba(13,37,63,0.8)",
          color: "#f5f0e1",
          border: "2px solid #f5f0e1",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        }}
      >
        ← Back
      </button>

      {/* Engine Status Indicators */}
      {!engineReady && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            left: "20px",
            padding: "10px 15px",
            backgroundColor: "rgba(255,150,0,0.9)",
            color: "white",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            fontSize: "12px",
          }}
        >
          ⚠️ Engine Offline (Random Moves)
        </div>
      )}

{engineThinking && (
  <div
    style={{
      position: "absolute",
      top: "70px",
      right: "20px",
      padding: "14px 24px",
      background: "rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      color: "#fff",
      borderRadius: "16px",
      fontWeight: "600",
      fontSize: "15px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      animation: "fadeInSlide 0.3s ease-out",
    }}
  >
    <div style={{
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: "#4ade80",
      boxShadow: "0 0 10px #4ade80",
      animation: "blink 1.5s ease-in-out infinite"
    }} />
    <span>Engine analyzing...</span>
    <style>{`
      @keyframes fadeInSlide {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `}</style>
  </div>
)}

      {/* Position Evaluation Display */}
      {engineReady && currentGameId && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            padding: "12px 20px",
            backgroundColor: "rgba(13,37,63,0.9)",
            color: "#f5f0e1",
            border: "2px solid #f5f0e1",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            minWidth: "150px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", marginBottom: "4px" }}>Position Eval</div>
          <div style={{ fontSize: "20px", color: positionEval > 0 ? "#4ade80" : positionEval < 0 ? "#f87171" : "#ffffff" }}>
            {positionEval > 0 ? "+" : ""}{(positionEval / 100).toFixed(2)}
          </div>
          <div style={{ fontSize: "10px", marginTop: "2px" }}>
            {positionEval > 0 ? "White advantage" : positionEval < 0 ? "Black advantage" : "Equal"}
          </div>
        </div>
      )}

      {engineError && engineReady && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            backgroundColor: "rgba(255,100,100,0.9)",
            color: "white",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            maxWidth: "80%",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          {engineError}
        </div>
      )}

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
            transform: `rotate(${boardRotation}deg)`,
            transition: "transform 0.5s",
          }}
        >

          <Chessboard options={chessboardOptions} boardWidth={boardWidth} />
        </div>

        <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={undoMove}
            disabled={chessGame.history().length === 0}
            style={{
              padding: "8px 12px",
              backgroundColor: chessGame.history().length === 0 ? "#666" : "#e94560",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: chessGame.history().length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Undo
          </button>
          <button
            onClick={redoMove}
            disabled={redoStack.length === 0}
            style={{
              padding: "8px 12px",
              backgroundColor: redoStack.length === 0 ? "#666" : "#e94560",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: redoStack.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Redo
          </button>
          <button
            onClick={restartGame}
            style={{
              padding: "8px 12px",
              backgroundColor: "#e94560",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Restart
          </button>
          <button
            onClick={rotate90}
            style={{
              padding: "8px 12px",
              backgroundColor: "#e94560",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Rotate 90°
          </button>
          <button
            onClick={rotate180}
            style={{
              padding: "8px 12px",
              backgroundColor: "#e94560",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Rotate 180°
          </button>
        </div>
      </div>

      {/* Move list */}
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
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
        <p style={{ marginBottom: "10px", fontWeight: "bold", color: "#ff4d4d" }}>Choose Promotion</p>
          <div style={{ display: "flex", gap: "15px" }}>
            {["q","r","b","n"].map(p => {
              const Icon = pieceIcons[p];
              return <button key={p} onClick={() => choosePromotion(p)} style={{border:"2px solid #ff4d4d", borderRadius:"8px", padding:"10px", backgroundColor:"#ffe6e6", cursor:"pointer", fontSize:"28px"}}><Icon /></button>
            })}
          </div>
        </div>
      )}

      {winner && <CheckmateDialog winner={winner} onRestart={restartGame} />}
    </div>
  );
}