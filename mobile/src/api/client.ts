import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '../utils/secureStore';

// Extracts host IP dynamically from Expo packager/Metro when running on physical device or emulator
const getExpoHostIp = (): string | null => {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any)?.manifest?.debuggerHost ||
      (Constants as any)?.manifest?.hostUri;

    if (hostUri && typeof hostUri === 'string') {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch {
    // Ignore error
  }
  return null;
};

const resolveBaseUrl = (): string => {
  // 1. In Web browser, use env or localhost
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5055';
  }

  // 2. If running via Expo Go / Metro on physical device or emulator,
  // hostUri will automatically point to the computer's LAN IP (e.g. 192.168.1.36)
  const expoHost = getExpoHostIp();
  if (expoHost) {
    return `http://${expoHost}:5055`;
  }

  // 3. If explicit environment variable is set and not localhost, use it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 4. Default LAN IP of the host machine for physical devices on same Wi-Fi
  return 'http://192.168.1.36:5055';
};

export const API_BASE_URL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve();
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/api/auth/login') || originalRequest.url?.includes('/api/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = await storage.getRefreshToken();
        if (!currentRefreshToken) throw new Error('No refresh token available');

        const refreshRes = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          token: currentRefreshToken,
        });

        const { accessToken, refreshToken } = refreshRes.data;
        await storage.setAccessToken(accessToken);
        if (refreshToken) await storage.setRefreshToken(refreshToken);

        processQueue(null);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as Error);
        await storage.clearAll();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
