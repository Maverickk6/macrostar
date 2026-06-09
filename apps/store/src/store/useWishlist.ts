import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  clearWishlist: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (item) => {
        const current = get().items;
        const exists = current.find((i) => i.id === item.id);
        if (exists) {
          set({ items: current.filter((i) => i.id !== item.id) });
        } else {
          set({ items: [...current, item] });
        }
      },
      hasItem: (id) => get().items.some((i) => i.id === id),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'macrostar-wishlist-storage',
    }
  )
);
