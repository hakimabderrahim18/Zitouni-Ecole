import { create } from 'zustand';
import axios from 'axios';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('zitouni_user')) || null,
  profile: JSON.parse(localStorage.getItem('zitouni_profile')) || null,
  accessToken: localStorage.getItem('zitouni_access_token') || null,
  refreshToken: localStorage.getItem('zitouni_refresh_token') || null,
  isLoading: false,
  error: null,

  setSession: (user, profile, accessToken, refreshToken) => {
    localStorage.setItem('zitouni_user', JSON.stringify(user));
    localStorage.setItem('zitouni_profile', JSON.stringify(profile));
    localStorage.setItem('zitouni_access_token', accessToken);
    localStorage.setItem('zitouni_refresh_token', refreshToken);

    set({ user, profile, accessToken, refreshToken, error: null });
  },

  logout: () => {
    localStorage.removeItem('zitouni_user');
    localStorage.removeItem('zitouni_profile');
    localStorage.removeItem('zitouni_access_token');
    localStorage.removeItem('zitouni_refresh_token');

    set({ user: null, profile: null, accessToken: null, refreshToken: null, error: null });
  },

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/api/auth/login', {
        identifier,
        username: identifier,
        email: identifier,
        password,
      });
      const { user, profile, accessToken, refreshToken } = response.data;

      get().setSession(user, profile, accessToken, refreshToken);
      set({ isLoading: false });
      return { user, role: user.role };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  refreshAccessToken: async () => {
    const currentRefreshToken = get().refreshToken;
    if (!currentRefreshToken) return get().logout();

    try {
      const response = await axios.post('/api/auth/refresh', { token: currentRefreshToken });
      const { accessToken, refreshToken } = response.data;

      localStorage.setItem('zitouni_access_token', accessToken);
      localStorage.setItem('zitouni_refresh_token', refreshToken);

      set({ accessToken, refreshToken });
    } catch (err) {
      get().logout();
    }
  },
}));

// Set up Axios request interceptors to append Bearer JWT automatically
axios.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refreshing on 401s
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest.url && (originalRequest.url.includes('/api/auth/login') || originalRequest.url.includes('/api/auth/refresh'));
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      await useAuthStore.getState().refreshAccessToken();
      const newToken = useAuthStore.getState().accessToken;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);
