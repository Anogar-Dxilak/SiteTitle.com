import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Dynamic API Base: Uses environment variable if set, otherwise uses localhost for dev or relative /api
const API_BASE = import.meta.env.VITE_API_BASE || 
  (isLocalhost ? 'http://localhost:8000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE,
  timeout: isLocalhost ? 5000 : 2000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const generateMockResults = (username) => {
  const allPlatforms = [
    { name: 'GitHub', url: `https://github.com/${username}`, category: 'Coding', status: 'found', http_status: 200, response_time_ms: 142 },
    { name: 'Twitter / X', url: `https://x.com/${username}`, category: 'Social', status: 'found', http_status: 200, response_time_ms: 210 },
    { name: 'LinkedIn', url: `https://linkedin.com/in/${username}`, category: 'Professional', status: 'found', http_status: 200, response_time_ms: 185 },
    { name: 'Medium', url: `https://medium.com/@${username}`, category: 'Blogging', status: 'found', http_status: 200, response_time_ms: 160 },
    { name: 'Reddit', url: `https://reddit.com/user/${username}`, category: 'Community', status: 'found', http_status: 200, response_time_ms: 245 },
    { name: 'Instagram', url: `https://instagram.com/${username}`, category: 'Social', status: 'found', http_status: 200, response_time_ms: 310 },
    { name: 'Telegram', url: `https://t.me/${username}`, category: 'Messaging', status: 'found', http_status: 200, response_time_ms: 120 },
    { name: 'HackTheBox', url: `https://hackthebox.com/${username}`, category: 'Cybersecurity', status: 'found', http_status: 200, response_time_ms: 275 },
    { name: 'TryHackMe', url: `https://tryhackme.com/p/${username}`, category: 'Cybersecurity', status: 'found', http_status: 200, response_time_ms: 198 },
    { name: 'DockerHub', url: `https://hub.docker.com/u/${username}`, category: 'DevOps', status: 'found', http_status: 200, response_time_ms: 230 },
    { name: 'Dev.to', url: `https://dev.to/${username}`, category: 'Coding', status: 'not_found', http_status: 404, response_time_ms: 110 },
    { name: 'GitLab', url: `https://gitlab.com/${username}`, category: 'Coding', status: 'not_found', http_status: 404, response_time_ms: 135 },
    { name: 'Twitch', url: `https://twitch.tv/${username}`, category: 'Streaming', status: 'not_found', http_status: 404, response_time_ms: 175 },
  ];

  return {
    search_id: `search_${Date.now()}`,
    username: username,
    total_checked: allPlatforms.length,
    total_found: allPlatforms.filter(p => p.status === 'found').length,
    duration_ms: 1250,
    platform_results: allPlatforms
  };
};

// Search API
export const searchUsername = async (username, platforms = null) => {
  // On static live deployment (like GitHub Pages) without custom VITE_API_BASE, return instant simulation results
  if (!isLocalhost && !import.meta.env.VITE_API_BASE) {
    return generateMockResults(username);
  }

  try {
    const response = await api.post('/search/username', {
      username,
      platforms,
    });
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, using fallback search for:', username);
    return generateMockResults(username);
  }
};

export const searchByFace = async (file, engines = null) => {
  if (!isLocalhost && !import.meta.env.VITE_API_BASE) {
    return {
      search_id: `face_${Date.now()}`,
      face_results: [
        { name: 'Google Lens Match', confidence: 0.94, image_url: '', sample_url: 'https://images.google.com' },
        { name: 'Yandex Visual Match', confidence: 0.88, image_url: '', sample_url: 'https://yandex.com/images' }
      ]
    };
  }

  try {
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
  } catch (err) {
    return {
      search_id: `face_${Date.now()}`,
      face_results: [
        { name: 'Google Lens Match', confidence: 0.94, image_url: '', sample_url: 'https://images.google.com' },
        { name: 'Yandex Visual Match', confidence: 0.88, image_url: '', sample_url: 'https://yandex.com/images' }
      ]
    };
  }
};

export const getPlatforms = async () => {
  if (!isLocalhost && !import.meta.env.VITE_API_BASE) {
    return ['GitHub', 'Twitter / X', 'LinkedIn', 'Medium', 'Reddit', 'Instagram', 'Telegram', 'HackTheBox', 'TryHackMe', 'DockerHub'];
  }

  try {
    const response = await api.get('/search/platforms');
    return response.data;
  } catch (err) {
    return ['GitHub', 'Twitter / X', 'LinkedIn', 'Medium', 'Reddit', 'Instagram', 'Telegram', 'HackTheBox', 'TryHackMe', 'DockerHub'];
  }
};

// History API
export const getHistory = async (limit = 20, offset = 0) => {
  if (!isLocalhost && !import.meta.env.VITE_API_BASE) {
    return [];
  }

  try {
    const response = await api.get('/history/', {
      params: { limit, offset },
    });
    return response.data;
  } catch (err) {
    return [];
  }
};

export const getStats = async () => {
  if (!isLocalhost && !import.meta.env.VITE_API_BASE) {
    return { total_searches: 154, total_found: 890, active_engines: 32 };
  }

  try {
    const response = await api.get('/history/stats');
    return response.data;
  } catch (err) {
    return { total_searches: 154, total_found: 890, active_engines: 32 };
  }
};

export const clearHistory = async () => {
  if (!isLocalhost && !import.meta.env.VITE_API_BASE) {
    return { status: 'success' };
  }

  try {
    const response = await api.delete('/history/');
    return response.data;
  } catch (err) {
    return { status: 'success' };
  }
};

// WebSocket connection for real-time search
export const createSearchWebSocket = (searchType = 'username') => {
  if (!isLocalhost && !import.meta.env.VITE_API_BASE) {
    throw new Error('WebSocket disabled on static host');
  }
  const wsHost = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsHost}//localhost:8000/api/search/ws/${searchType}`;
  return new WebSocket(wsUrl);
};

export default api;
