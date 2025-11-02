import React from "react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  bg: "#1a1a2e",
  surface: "#162447",
  primary: "#e94560",
  secondary: "#f0e3ca",
  text: "#f0e3ca",
};

export default function ChessInfoPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        color: COLORS.text,
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        lineHeight: 1.6,
        position: "relative",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "8px 14px",
          backgroundColor: COLORS.surface,
          color: COLORS.secondary,
          border: `2px solid ${COLORS.secondary}`,
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        }}
      >
        ← Back
      </button>

      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ color: COLORS.primary, fontSize: "3rem", marginBottom: "10px" }}>
          Introduction to Chess
        </h1>
        <p style={{ color: COLORS.secondary, fontSize: "1.2rem" }}>
          The timeless game of strategy, intellect, and history.
        </p>
      </header>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ color: COLORS.primary, marginBottom: "15px" }}>What is Chess?</h2>
        <p>
          Chess is a two-player strategy board game played on an 8×8 grid called a chessboard.
          Each player commands an army of 16 pieces, including pawns, rooks, knights, bishops, 
          a queen, and a king. The goal is to checkmate the opponent's king, meaning it is under 
          threat of capture with no possible escape.
        </p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ color: COLORS.primary, marginBottom: "15px" }}>Historical Significance</h2>
        <p>
          Chess is more than just a game; it has played an important role in culture, politics, 
          and education throughout history. It has been a tool for teaching strategic thinking, 
          planning, and decision-making. Chess masters were often respected advisors in royal 
          courts and military planning.
        </p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ color: COLORS.primary, marginBottom: "15px" }}>Origins & Chaturanga</h2>
        <p>
          Chess is believed to have originated in India around the 6th century AD as a game 
          called <strong>Chaturanga</strong>, which means "four divisions" referring to 
          the ancient Indian army units: infantry, cavalry, elephants, and chariots. 
          Chaturanga eventually spread to Persia and then Europe, evolving into the modern 
          game we know today.
        </p>
        <p>
          The transformation from Chaturanga to Chess demonstrates a rich cultural exchange, 
          linking ancient strategies with contemporary intellectual pursuits. 
          Chess, therefore, carries with it centuries of tradition and human ingenuity.
        </p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ color: COLORS.primary, marginBottom: "15px" }}>Chess Today</h2>
        <p>
          Today, chess is played worldwide by millions of people, both casually and competitively. 
          Online platforms, international tournaments, and AI chess engines have made the game 
          more accessible than ever. Chess is celebrated not just as a game, but as an art of 
          critical thinking and strategy.
        </p>
      </section>

      <footer style={{ textAlign: "center", marginTop: "60px", color: COLORS.secondary }}>
        <p>© 2025 Chess Insights | Learn, Play, and Master the Game</p>
      </footer>
    </div>
  );
}
