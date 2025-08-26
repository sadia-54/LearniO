import axios from 'axios';

// Prefer NEXT_PUBLIC_API_BASE_URL for client-side usage.
// Fallback to localhost for dev. Strip trailing slash to avoid double slashes.
const baseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
