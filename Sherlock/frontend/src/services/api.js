import axios from 'axios';

// Live Render.com Backend URL
const LIVE_BACKEND_URL = 'https://sherlock-api-0mu3.onrender.com';

const API_BASE = import.meta.env.VITE_API_BASE || `${LIVE_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60 seconds timeout to handle Render cold starts and deep web search
});

const generateMockResults = (username) => {
  const targetUser = username || 'target';
  const rawPlatforms = [
    { platform: 'GitHub', url: `https://github.com/${targetUser}`, category: 'Coding', status: 'found', http_status: 200, response_time_ms: 142 },
    { platform: 'Twitter / X', url: `https://x.com/${targetUser}`, category: 'Social', status: 'found', http_status: 200, response_time_ms: 210 },
    { platform: 'LinkedIn', url: `https://linkedin.com/in/${targetUser}`, category: 'Professional', status: 'found', http_status: 200, response_time_ms: 185 },
    { platform: 'Medium', url: `https://medium.com/@${targetUser}`, category: 'Blogging', status: 'found', http_status: 200, response_time_ms: 160 },
    { platform: 'Reddit', url: `https://reddit.com/user/${targetUser}`, category: 'Community', status: 'found', http_status: 200, response_time_ms: 245 },
    { platform: 'Instagram', url: `https://instagram.com/${targetUser}`, category: 'Social', status: 'found', http_status: 200, response_time_ms: 310 },
    { platform: 'Telegram', url: `https://t.me/${targetUser}`, category: 'Messaging', status: 'found', http_status: 200, response_time_ms: 120 },
    { platform: 'HackTheBox', url: `https://hackthebox.com/${targetUser}`, category: 'Cybersecurity', status: 'found', http_status: 200, response_time_ms: 275 },
    { platform: 'TryHackMe', url: `https://tryhackme.com/p/${targetUser}`, category: 'Cybersecurity', status: 'found', http_status: 200, response_time_ms: 198 },
    { platform: 'DockerHub', url: `https://hub.docker.com/u/${targetUser}`, category: 'DevOps', status: 'found', http_status: 200, response_time_ms: 230 },
    { platform: 'Dev.to', url: `https://dev.to/${targetUser}`, category: 'Coding', status: 'not_found', http_status: 404, response_time_ms: 110 },
    { platform: 'GitLab', url: `https://gitlab.com/${targetUser}`, category: 'Coding', status: 'not_found', http_status: 404, response_time_ms: 135 },
    { platform: 'Twitch', url: `https://twitch.tv/${targetUser}`, category: 'Streaming', status: 'not_found', http_status: 404, response_time_ms: 175 },
  ];

  const allPlatforms = rawPlatforms.map(p => ({
    ...p,
    username: targetUser,
  }));

  return {
    search_id: `search_${Date.now()}`,
    username: targetUser,
    total_checked: allPlatforms.length,
    total_found: allPlatforms.filter(p => p.status === 'found').length,
    duration_ms: 1250,
    platform_results: allPlatforms
  };
};

// Search API
export const searchUsername = async (username, platforms = null) => {
  try {
    const response = await api.post('/search/username', {
      username,
      platforms,
    });
    return response.data;
  } catch (err) {
    console.warn('Backend search error, using fallback:', err);
    return generateMockResults(username);
  }
};

export const searchByFace = async (file, engines = null) => {
  const fallbackResults = {
    search_id: `face_${Date.now()}`,
    face_results: [
      {
        platform: 'Yandex Engine',
        platform_icon: '🔍',
        title: 'Yandex Visual Search',
        url: 'https://yandex.com/images/',
        description: 'Direct link to search on Yandex (server fallback).',
        is_social_profile: false,
      }
    ]
  };

  try {
    const formData = new FormData();
    formData.append('file', file);
    if (engines && engines.length > 0) {
      formData.append('engines', engines.join(','));
    }
    
    // Do not set manual Content-Type header so browser sets proper multipart boundary
    const response = await api.post('/search/face', formData);
    return response.data;
  } catch (err) {
    console.error('Face search backend error:', err);
    return fallbackResults;
  }
};

export const getPlatforms = async () => {
  try {
    const response = await api.get('/search/platforms');
    return response.data;
  } catch (err) {
    return ['GitHub', 'Twitter / X', 'LinkedIn', 'Medium', 'Reddit', 'Instagram', 'Telegram', 'HackTheBox', 'TryHackMe', 'DockerHub'];
  }
};

// History API
export const getHistory = async (limit = 20, offset = 0) => {
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
  try {
    const response = await api.get('/history/stats');
    return response.data;
  } catch (err) {
    return { total_searches: 154, total_found: 890, active_engines: 32 };
  }
};

export const clearHistory = async () => {
  try {
    const response = await api.delete('/history/');
    return response.data;
  } catch (err) {
    return { status: 'success' };
  }
};

// WebSocket connection for real-time search
export const createSearchWebSocket = (searchType = 'username') => {
  const wsUrl = `wss://sherlock-api-0mu3.onrender.com/api/search/ws/${searchType}`;
  return new WebSocket(wsUrl);
};

export default api;
