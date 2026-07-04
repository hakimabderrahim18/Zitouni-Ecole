import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import AppRoutes from './routes';
import './index.css';
import './i18n'; // Initialize localization settings

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
