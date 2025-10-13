import React from "react";
import ChessBoardComponentPvC from "./components/ChessBoardComponentPvC";
import ChessBoardComponentPvP from "./components/ChessBoardComponentPvP";
import LandingPage from "./pages/LandingPage";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    // <Router>
    //   <Routes>
    //     <Route path="/" element={<LandingPage />} />
    //   </Routes>
    // </Router>
    <>
      {/* <ChessBoardComponentPvP playerColour={'white'} isTimerOn={true} minutes={1}/> */}
      <ChessBoardComponentPvC playerColour={'white'}/>
    </>
  );
}

export default App;
