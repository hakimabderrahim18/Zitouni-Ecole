import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import AppRoutes from './routes';
import './index.css';
import './i18n'; // Initialize localization settings

// Permanent Prestige Académique Visual Identity (Bordeaux #7B1E3A + Beige Crème #F3E9DC)
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('theme-blue-roi', 'dark', 'theme-default');
  document.documentElement.classList.add('theme-prestige', 'theme-sand');
  try {
    localStorage.setItem('theme', 'prestige');
  } catch (e) {
    /* ignore */
  }
}

// In production the API lives on a separate host (Render). In development
// VITE_API_URL is empty and the Vite dev-server proxy handles /api and /socket.io.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// Register Service Worker for PWA (Article 6)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('PWA ServiceWorker registered successfully:', reg.scope))
      .catch((err) => console.log('PWA ServiceWorker registration failed:', err));
  });
}
