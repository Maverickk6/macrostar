import { create } from 'zustand';

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

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  login: (token, user) => {
    localStorage.setItem('macrostar-admin-token', token);
    localStorage.setItem('macrostar-admin-user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('macrostar-admin-token');
    localStorage.removeItem('macrostar-admin-user');
    set({ token: null, user: null });
  },
  checkAuth: () => {
    if (get().token) return true;
    const localToken = localStorage.getItem('macrostar-admin-token');
    const localUser = localStorage.getItem('macrostar-admin-user');
    if (localToken && localUser) {
      set({ token: localToken, user: JSON.parse(localUser) });
      return true;
    }
    return false;
  },
}));
