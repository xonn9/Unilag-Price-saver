// exports a single constant API_URL
export const API_URL = (() => {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    
    // Check for environment variable or configuration
    if (window.APP_API_URL) {
      return window.APP_API_URL;
    }
    
    // Vercel deployment
    if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
      return `${origin}/api`;
    }
    
    // Render deployment - API is typically at same origin or /api
    if (hostname.includes('render.com') || hostname.includes('onrender.com')) {
      // Try /api first (if backend serves frontend), otherwise use same origin
      return `${origin}/api`;
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      // Check if we're accessing from the backend server itself
      const port = window.location.port;
      if (port === '8000' || !port) {
        return `${origin}/api`;
      }
      return 'http://localhost:8000/api';
    }
    
    // Default: assume API is at /api on same origin
    return `${origin}/api`;
  })();
  