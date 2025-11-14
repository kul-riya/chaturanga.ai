/**
 * API service using Axios for backend communication
 */
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== Player APIs ====================

export const createPlayer = async (name, rating = null, country = null) => {
  try {
    const response = await api.post('/player', { name, rating, country });
    return response.data;
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
};

export const getPlayer = async (playerId) => {
  try {
    const response = await api.get(`/player/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player:', error);
    throw error;
  }
};

export const getAllPlayers = async () => {
  try {
    const response = await api.get('/players');
    return response.data;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

export const ensureComputerPlayer = async () => {
  try {
    const response = await api.post('/ensure-computer');
    return response.data;
  } catch (error) {
    console.error('Error ensuring computer player:', error);
    throw error;
  }
};

// ==================== Game APIs ====================

export const createGame = async (playerWhiteId, playerBlackId, result = '*', openingId = null) => {
  try {
    const response = await api.post('/game', {
      player_white_id: playerWhiteId,
      player_black_id: playerBlackId,
      result,
      opening_id: openingId,
    });
    console.log("response.data: ", response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

export const updateGameResult = async (gameId, result) => {
  try {
    const response = await api.put(`/game/${gameId}`, { result });
    return response.data;
  } catch (error) {
    console.error('Error updating game:', error);
    throw error;
  }
};

export const updateGameOpening = async (gameId, openingId) => {
  try {
    const response = await api.put(`/game/${gameId}`, { opening_id: openingId });
    return response.data;
  } catch (error) {
    console.error('Error updating game opening:', error);
    throw error;
  }
};

// ==================== Opening APIs ====================

export const createOpening = async (ecoCode, name, moveSequence) => {
  try {
    const response = await api.post('/opening', { eco_code: ecoCode, name, move_sequence: moveSequence });
    return response.data;
  } catch (error) {
    console.error('Error creating opening:', error);
    throw error;
  }
};

export const findOrCreateOpening = async (moveSequence) => {
  try {
    const response = await api.post('/opening/find-or-create', { move_sequence: moveSequence });
    return response.data;
  } catch (error) {
    console.error('Error finding/creating opening:', error);
    throw error;
  }
};

// ==================== Move APIs ====================

export const recordMove = async (moveData) => {
  try {
    const response = await api.post('/move', moveData);
    return response.data;
  } catch (error) {
    console.error('Error recording move:', error);
    throw error;
  }
};

// engine analysis APIs
export const recordEngineMove = async (moveData) => {
  try {
    const response = await api.post('/engine-move', moveData);
    return response.data;
  } catch (error) {
    console.error('Error recording move:', error);
    throw error;
  }
};

// ==================== Metadata APIs ====================

export const getMetadata = async () => {
  try {
    const response = await api.get('/metadata');
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    throw error;
  }
};

// ==================== Query APIs ====================

export const runQuery = async (query) => {
  try {
    const response = await api.post('/run-query', { query });
    return response.data;
  } catch (error) {
    console.error('Error running query:', error);
    throw error;
  }
};

export const getSampleQueries = async () => {
  try {
    const response = await api.get('/sample-queries');
    return response.data;
  } catch (error) {
    console.error('Error fetching sample queries:', error);
    throw error;
  }
};

export default api;

