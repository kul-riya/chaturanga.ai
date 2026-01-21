const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let engineProcess = null;
let isEngineReady = false;

// Initialize the chess engine
function initializeEngine() {
  console.log('Starting chess engine...');
  
  // Use the Windows executable
   const enginePath = path.join(__dirname, 'chess_0x88');
  
  // Linux executable
  // const enginePath = 'chess_0x88';
  console.log('Engine path:', enginePath);
  
  engineProcess = spawn(enginePath);
  
  engineProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Engine output:', output);
    
    if (output.includes('uciok')) {
      isEngineReady = true;
      console.log('✓ Engine is ready!');
    }
  });
  
  engineProcess.stderr.on('data', (data) => {
    console.error('Engine error:', data.toString());
  });
  
  engineProcess.on('error', (error) => {
    console.error('Failed to start engine:', error);
    isEngineReady = false;
  });
  engineProcess.on('close', (code) => {
    console.log(`Engine process exited with code ${code}`);
    isEngineReady = false;
  });
  
  
  // Send UCI initialization commands
  setTimeout(() => {
    if (engineProcess && engineProcess.stdin) {
      engineProcess.stdin.write('uci\n');
      
      // Wait for uciok, then send ucinewgame
      setTimeout(() => {
        if (engineProcess && engineProcess.stdin) {
          engineProcess.stdin.write('ucinewgame\n');
          engineProcess.stdin.write('isready\n');
        }
      }, 200);
    }
  }, 100);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running',
    engineReady: isEngineReady 
  });
});

// Get best move from engine
app.post('/get-move', async (req, res) => {
  const { fen, depth = 4 } = req.body;
  
  if (!isEngineReady) {
    return res.status(503).json({ error: 'Engine not ready' });
  }
  
  if (!fen) {
    return res.status(400).json({ error: 'FEN position required' });
  }
  
  console.log(`\n--- New move request ---`);
  console.log(`FEN: ${fen}`);
  console.log(`Depth: ${depth}`);
  
  try {
    // Set up the position
    const positionCommand = `position fen ${fen}\n`;
    engineProcess.stdin.write(positionCommand);
    
    // Request best move
    const goCommand = `go depth ${depth}\n`;
    engineProcess.stdin.write(goCommand);
    
    let output = '';
    let bestMove = null;
    let score = null;
    
    // Create a promise to handle async engine response
    const movePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        engineProcess.stdout.removeListener('data', dataHandler);
        reject(new Error('Engine timeout'));
      }, 10000); // 10 second timeout
      
      const dataHandler = (data) => {
        output += data.toString();
        
        // Look for score info
        const scoreMatch = output.match(/info score cp (-?\d+)/);
        if (scoreMatch) {
          score = parseInt(scoreMatch[1]);
        }
        
        // Look for bestmove
        const moveMatch = output.match(/bestmove (\S+)/);
        if (moveMatch) {
          bestMove = moveMatch[1];
          clearTimeout(timeout);
          engineProcess.stdout.removeListener('data', dataHandler);
          resolve({ move: bestMove, score });
        }
      };
      
      engineProcess.stdout.on('data', dataHandler);
    });
    
    const result = await movePromise;
    console.log(`Best move: ${result.move}`);
    console.log(`Score: ${result.score}`);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error getting move:', error);
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  if (engineProcess) {
    engineProcess.stdin.write('quit\n');
    engineProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  if (engineProcess) {
    engineProcess.stdin.write('quit\n');
    engineProcess.kill();
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Chess engine server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health\n`);
  initializeEngine();
});
