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
