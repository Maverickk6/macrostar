import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
  validateToken: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => {
        set({ token, user });
      },
      logout: () => {
        set({ token: null, user: null });
      },
      checkAuth: () => {
        return get().token !== null && get().user !== null;
      },
      validateToken: () => {
        const token = get().token;
        if (!token) return false;

        try {
          // Decode JWT to check expiration
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Date.now() / 1000;
          
          // Check if token is expired
          if (payload.exp && payload.exp < now) {
            get().logout();
            return false;
          }
          
          return true;
        } catch (err) {
          // If token is invalid, logout
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'macrostar-admin-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
