import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  sku: string | null;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          const newQty = Math.min(existingItem.quantity + qty, item.stock);
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: newQty } : i
            ),
          });
        } else {
          set({
            items: [...currentItems, { ...item, quantity: Math.min(qty, item.stock) }],
          });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        const newQty = Math.max(1, Math.min(quantity, item.stock));
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: newQty } : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getSubtotal: () =>
        get().items.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0),
    }),
    {
      name: 'macrostar-cart-storage',
    }
  )
);
