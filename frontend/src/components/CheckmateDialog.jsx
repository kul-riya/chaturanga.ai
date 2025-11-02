import React from "react";

export default function CheckmateDialog({ winner, onRestart }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#fff0f0",
        border: "3px solid #ff4d4d",
        borderRadius: "15px",
        padding: "20px 30px",
        zIndex: 200,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#ff4d4d", marginBottom: "10px" }}>
        {winner ? `${winner.toUpperCase()} Wins!` : "Game Over"}
      </h2>
      <p style={{ marginBottom: "20px" }}>Checkmate!</p>
      <button
        onClick={onRestart}
        style={{
          backgroundColor: "#ff4d4d",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px 20px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Restart Game
      </button>
    </div>
  );
}
