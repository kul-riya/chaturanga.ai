import React from "react";
import ChessBoardComponentPvC from "./components/ChessBoardComponentPvC";
import ChessBoardComponentPvP from "./components/ChessBoardComponentPvP";

function App() {
  return (
    <>
      <ChessBoardComponentPvP isTimerOn={true} minutes={5} />
    </>
  );
}

export default App;
