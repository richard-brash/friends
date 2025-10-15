// API Configuration
const getApiBaseUrl = () => {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:4000/api';
  }
  
  // In production, use relative URL (same domain as frontend)
  return '/api';
};

export const API_BASE = getApiBaseUrl();