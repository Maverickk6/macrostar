import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCart } from './useCart';
import { useWishlist } from './useWishlist';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
}

interface AuthState {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (name: string, email: string, password: string, phone?: string, address?: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  fetchCurrentCustomer: () => Promise<void>;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      token: null,
      isLoading: false,
      error: null,

      register: async (name, email, password, phone, address) => {
        set({ isLoading: true, error: null });
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${apiUrl}/api/auth/customer/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              password,
              confirmPassword: password,
              phone: phone || null,
              address: address || null,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Registration failed');
          }

          // Sync guest cart/wishlist to server on successful registration
          await useCart.getState().syncCartToServer();
          await useWishlist.getState().syncWishlistToServer();

          set({
            customer: result.data.customer,
            token: result.data.token,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${apiUrl}/api/auth/customer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Login failed');
          }

          set({
            customer: result.data.customer,
            token: result.data.token,
            isLoading: false,
          });

          // Fetch cart/wishlist from server in background for better UX
          useCart.getState().fetchCart();
          useWishlist.getState().fetchWishlist();

          // Sync guest cart/wishlist to server in background
          useCart.getState().syncCartToServer();
          useWishlist.getState().syncWishlistToServer();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Clear cart/wishlist on logout but don't delete from database
        useCart.getState().clearCart(false);
        useWishlist.getState().clearWishlist(false);
        
        set({
          customer: null,
          token: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      fetchCurrentCustomer: async () => {
        const token = get().token;
        if (!token) return;

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${apiUrl}/api/auth/customer/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            set({ customer: result.data });
          } else {
            // Token is invalid, logout
            get().logout();
          }
        } catch (error) {
          console.error('Failed to fetch customer:', error);
        }
      },

      updateProfile: async (data) => {
        const token = get().token;
        if (!token) {
          throw new Error('Not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${apiUrl}/api/auth/customer/update-profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Failed to update profile');
          }

          set({
            customer: result.data,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update profile';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      isAuthenticated: () => {
        return get().token !== null && get().customer !== null;
      },
    }),
    {
      name: 'macrostar-auth',
      partialize: (state) => ({
        customer: state.customer,
        token: state.token,
      }),
    }
  )
);
