import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Search API
export const searchUsername = async (username, platforms = null) => {
  const response = await api.post('/search/username', {
    username,
    platforms,
  });
  return response.data;
};

export const searchByFace = async (file, engines = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (engines) {
    formData.append('engines', engines.join(','));
  }
  
  const response = await api.post('/search/face', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getPlatforms = async () => {
  const response = await api.get('/search/platforms');
  return response.data;
};

// History API
export const getHistory = async (limit = 20, offset = 0) => {
  const response = await api.get('/history/', {
    params: { limit, offset },
  });
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/history/stats');
  return response.data;
};

export const clearHistory = async () => {
  const response = await api.delete('/history/');
  return response.data;
};

// WebSocket connection for real-time search
export const createSearchWebSocket = (searchType = 'username') => {
  const wsUrl = `ws://localhost:8000/api/search/ws/${searchType}`;
  return new WebSocket(wsUrl);
};

export default api;
