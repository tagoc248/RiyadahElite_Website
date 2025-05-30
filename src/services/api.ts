import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/register', { name, email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  googleAuth: async (token: string) => {
    const response = await api.post('/google-auth', { token });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
};

export const tournaments = {
  getAll: async () => {
    const response = await api.get('/tournaments');
    return response.data;
  },

  create: async (data: { title: string; description: string; date: string }) => {
    const response = await api.post('/tournaments', data);
    return response.data;
  },
};

export const rewards = {
  getAll: async () => {
    const response = await api.get('/rewards');
    return response.data;
  },

  claim: async (rewardId: number) => {
    const response = await api.post('/rewards/claim', { rewardId });
    return response.data;
  },
};

export default api;