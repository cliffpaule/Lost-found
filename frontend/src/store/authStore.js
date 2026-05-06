import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { user, accessToken, refreshToken } = res.data.data;
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return user;
      },

      register: async (data) => {
        const res = await api.post('/auth/register', data);
        const { user, accessToken, refreshToken } = res.data.data;
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return user;
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),

      fetchMe: async () => {
        try {
          const { accessToken } = get();
          if (!accessToken) return;
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          const res = await api.get('/auth/me');
          set({ user: res.data.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      initAuth: () => {
        const { accessToken } = get();
        if (accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
      }
    }),
    {
      name: 'lu-lf-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
