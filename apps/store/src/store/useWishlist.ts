import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuth as useCustomerAuth } from './useCustomerAuth';

export interface WishlistItem {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  sku: string | null;
  stock: number;
}

interface WishlistState {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  hasItem: (id: number) => boolean;
  clearWishlist: (syncToServer?: boolean) => void;
  fetchWishlist: () => Promise<void>;
  syncWishlistToServer: () => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: async (item) => {
        const current = get().items;
        const exists = current.find((i) => i.id === item.id);
        if (exists) {
          set({ items: current.filter((i) => i.id !== item.id) });

          // Sync to server if logged in
          const token = useCustomerAuth.getState().token;
          if (token) {
            try {
              await fetch(`${API_URL}/api/wishlist/${item.id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
            } catch (err) {
              console.error('Failed to sync wishlist to server:', err);
            }
          }
        } else {
          set({ items: [...current, item] });

          // Sync to server if logged in
          const token = useCustomerAuth.getState().token;
          if (token) {
            try {
              await fetch(`${API_URL}/api/wishlist`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ productId: item.id }),
              });
            } catch (err) {
              console.error('Failed to sync wishlist to server:', err);
            }
          }
        }
      },
      hasItem: (id) => get().items.some((i) => i.id === id),
      clearWishlist: async (syncToServer = true) => {
        set({ items: [] });

        // Sync to server if logged in and syncToServer is true
        const token = useCustomerAuth.getState().token;
        if (token && syncToServer) {
          try {
            await fetch(`${API_URL}/api/wishlist`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            console.error('Failed to sync wishlist to server:', err);
          }
        }
      },
      fetchWishlist: async () => {
        const token = useCustomerAuth.getState().token;
        if (!token) return;

        try {
          const res = await fetch(`${API_URL}/api/wishlist`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const json = await res.json();
            set({ items: json.data || [] });
          }
        } catch (err) {
          console.error('Failed to fetch wishlist from server:', err);
        }
      },
      syncWishlistToServer: async () => {
        const token = useCustomerAuth.getState().token;
        if (!token) return;

        const items = get().items;
        try {
          // Clear server wishlist first
          await fetch(`${API_URL}/api/wishlist`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // Add all items to server
          for (const item of items) {
            await fetch(`${API_URL}/api/wishlist`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ productId: item.id }),
            });
          }
        } catch (err) {
          console.error('Failed to sync wishlist to server:', err);
        }
      },
    }),
    {
      name: 'macrostar-wishlist-storage',
    }
  )
);
