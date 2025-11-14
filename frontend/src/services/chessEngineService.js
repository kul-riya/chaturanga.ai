const ENGINE_API_URL = 'http://localhost:3001';

export const chessEngineService = {
  // Check if engine server is running
  async checkHealth() {
    try {
      const response = await fetch(`${ENGINE_API_URL}/health`);
      const data = await response.json();
      return data.engineReady;
    } catch (error) {
      console.error('Engine health check failed:', error);
      return false;
    }
  },

  // Get best move from engine
  async getBestMove(fen, depth = 4) {
    try {
      const response = await fetch(`${ENGINE_API_URL}/get-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen, depth }),
      });

      if (!response.ok) {
        throw new Error(`Engine returned status ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      
      return data;
    } catch (error) {
      console.error('Failed to get engine move:', error);
      throw error;
    }
  },
};