// API Configuration
const getApiBaseUrl = () => {
  // In development, use localhost (V2 backend on port 3000)
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api';
  }
  
  // In production, use relative URL (same domain as frontend)
  return '/api';
};

export const API_BASE = getApiBaseUrl();