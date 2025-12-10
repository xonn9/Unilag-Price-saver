// exports a single constant API_URL
export const API_URL = (() => {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
      // On Vercel, API routes are under /api prefix
      return `${window.location.origin}/api`;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return `http://${hostname}:8000`;
  })();
  