import axios from 'axios';

// Prefer NEXT_PUBLIC_API_BASE_URL for client-side usage.
// Fallback to localhost for dev.
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
