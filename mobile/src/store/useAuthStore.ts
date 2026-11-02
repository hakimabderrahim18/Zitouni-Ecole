import { create } from 'zustand';
import { storage } from '../utils/secureStore';
import { apiClient } from '../api/client';

export interface User {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: 'school' | 'admin' | 'teacher' | 'general_supervisor' | 'pedagogical_supervisor' | 'receptionist' | 'student' | 'parent';
  profilePic?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  updateUser: (partial: Partial<User>) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) storage.setUser(user);
    else storage.clearAll();
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ user: updated });
    storage.setUser(updated);
  },

  initialize: async () => {
    try {
      const token = await storage.getAccessToken();
      const cachedUser = await storage.getUser<User>();
      if (token && cachedUser) {
        set({ user: cachedUser, isAuthenticated: true });
        try {
          const res = await apiClient.get('/api/auth/me');
          if (res.data?.user) {
            set({ user: res.data.user });
            await storage.setUser(res.data.user);
          }
        } catch {
          // Token expired or invalid
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await storage.clearAll();
    set({ user: null, isAuthenticated: false });
  },
}));
