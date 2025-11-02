import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ExploreDialog = ({ type, onClose }) => {
  const navigate = useNavigate();
  const [showTimerSelect, setShowTimerSelect] = useState(false);

  const buttonStyle = {
    margin: "10px",
    padding: "12px 20px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#3b82f6",
    color: "white",
    fontWeight: "bold",
  };

  const containerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const dialogStyle = {
    backgroundColor: "#0d1b2a",
    padding: "30px",
    borderRadius: "12px",
    color: "white",
    textAlign: "center",
    minWidth: "300px",
  };

  const handleClick = (path) => {
    navigate(path);
    onClose();
  };

  const handleTimerChoice = (minutes) => {
    navigate(`/pvp/timer/${minutes}`);
    onClose();
  };

  return (
    <div style={containerStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: "#60a5fa", marginBottom: "20px" }}>
          {type === "pvp"
            ? "Player vs Player"
            : type === "pvc"
            ? "Player vs Computer"
            : "Explore More"}
        </h2>

        {type === "pvp" && !showTimerSelect && (
          <>
            <button style={buttonStyle} onClick={() => setShowTimerSelect(true)}>
              Play with Timer
            </button>
            <button
              style={buttonStyle}
              onClick={() => handleClick("/pvp/notimer")}
            >
              Play without Timer
            </button>
          </>
        )}

        {type === "pvp" && showTimerSelect && (
          <>
            <p style={{ marginBottom: "15px", color: "#a5b4fc" }}>
              Choose timer duration:
            </p>
            <div>
              {[5, 10, 30, 60].map((m) => (
                <button
                  key={m}
                  style={{
                    ...buttonStyle,
                    backgroundColor: "#2563eb",
                    margin: "5px",
                    padding: "10px 18px",
                  }}
                  onClick={() => handleTimerChoice(m)}
                >
                  {m} min
                </button>
              ))}
            </div>
            <button
              style={{ ...buttonStyle, backgroundColor: "#475569", marginTop: "15px" }}
              onClick={() => setShowTimerSelect(false)}
            >
              Back
            </button>
          </>
        )}

        {type === "pvc" && (
          <>
            <button
              style={buttonStyle}
              onClick={() => handleClick("/pvc/white")}
            >
              Play as White
            </button>
            <button
              style={buttonStyle}
              onClick={() => handleClick("/pvc/black")}
            >
              Play as Black
            </button>
          </>
        )}

        {type === "explore" && (
          <p style={{ color: "#94a3b8" }}>Coming soon...</p>
        )}

        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#ef4444",
            marginTop: "25px",
          }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ExploreDialog;
