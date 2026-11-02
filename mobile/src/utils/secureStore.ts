import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'zitouni_mobile_access_token';
const REFRESH_TOKEN_KEY = 'zitouni_mobile_refresh_token';
const USER_KEY = 'zitouni_mobile_user_data';

export const storage = {
  async getAccessToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
      }
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.setItem(ACCESS_TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch {}
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
      }
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.setItem(REFRESH_TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {}
  },

  async getUser<T>(): Promise<T | null> {
    try {
      if (Platform.OS === 'web') {
        const item = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
        return item ? JSON.parse(item) : null;
      }
      const data = await SecureStore.getItemAsync(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser<T>(user: T): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(user));
        return;
      }
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch {}
  },

  async clearAll(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {}
  }
};
