// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

//multipart/form-data POST register
export const register = (formData) =>
  API.post('/auth/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
export const login = (data) => API.post('/auth/login', data);
export const getMessages = (token) =>
  API.get('/messages', { headers: { Authorization: `Bearer ${token}` } });
