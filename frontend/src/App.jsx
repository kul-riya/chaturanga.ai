import React from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import ChessBoardComponentPvC from "./pages/ChessBoardComponentPvC";
import ChessBoardComponentPvP from "./pages/ChessBoardComponentPvP";
import LandingPage from "./pages/LandingPage";

// Helper component to handle dynamic timer route
function PvPTimerRoute() {
  const { minutes } = useParams();
  const mins = Number(minutes) || 5; // fallback if invalid
  return <ChessBoardComponentPvP isTimerOn={true} minutes={mins} />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Player vs Computer */}
        <Route path="/pvc/white" element={<ChessBoardComponentPvC playerColour="white" />} />
        <Route path="/pvc/black" element={<ChessBoardComponentPvC playerColour="black" />} />

        {/* Player vs Player */}
        <Route path="/pvp/notimer" element={<ChessBoardComponentPvP isTimerOn={false} />} />
        <Route path="/pvp/timer/:minutes" element={<PvPTimerRoute />} />
      </Routes>
    </Router>
  );
}

export default App;
