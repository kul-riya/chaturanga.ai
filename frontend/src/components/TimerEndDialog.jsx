import React from "react";

export default function TimerEndDialog({ winner, onRestart }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#fff3cd",
        border: "2px solid #ffecb5",
        borderRadius: "12px",
        padding: "20px 30px",
        textAlign: "center",
        zIndex: 100,
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      }}
    >
      <h2 style={{ color: "#856404" }}>⏱️ Time’s Up!</h2>
      <p style={{ fontWeight: "bold", fontSize: "18px", marginTop: "10px" }}>
        {winner} wins on time!
      </p>
      <button
        onClick={onRestart}
        style={{
          marginTop: "15px",
          padding: "8px 16px",
          backgroundColor: "#ffeeba",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Restart Game
      </button>
    </div>
  );
}
