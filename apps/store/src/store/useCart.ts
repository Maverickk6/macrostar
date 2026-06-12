import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuth as useCustomerAuth } from './useCustomerAuth';

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
  clearCart: (syncToServer?: boolean) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  fetchCart: () => Promise<void>;
  syncCartToServer: () => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (item, qty = 1) => {
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

        // Sync to server if logged in
        const token = useCustomerAuth.getState().token;
        if (token) {
          try {
            await fetch(`${API_URL}/api/cart`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ productId: item.id, quantity: qty }),
            });
          } catch (err) {
            console.error('Failed to sync cart to server:', err);
          }
        }
      },
      removeItem: async (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });

        // Sync to server if logged in
        const token = useCustomerAuth.getState().token;
        if (token) {
          try {
            await fetch(`${API_URL}/api/cart/${id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            console.error('Failed to sync cart to server:', err);
          }
        }
      },
      updateQuantity: async (id, quantity) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        const newQty = Math.max(1, Math.min(quantity, item.stock));
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: newQty } : i
          ),
        });

        // Sync to server if logged in
        const token = useCustomerAuth.getState().token;
        if (token) {
          try {
            await fetch(`${API_URL}/api/cart/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ quantity: newQty }),
            });
          } catch (err) {
            console.error('Failed to sync cart to server:', err);
          }
        }
      },
      clearCart: async (syncToServer = true) => {
        set({ items: [] });

        // Sync to server if logged in and syncToServer is true
        const token = useCustomerAuth.getState().token;
        if (token && syncToServer) {
          try {
            await fetch(`${API_URL}/api/cart`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            console.error('Failed to sync cart to server:', err);
          }
        }
      },
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getSubtotal: () =>
        get().items.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0),
      fetchCart: async () => {
        const token = useCustomerAuth.getState().token;
        if (!token) return;

        try {
          const res = await fetch(`${API_URL}/api/cart`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const json = await res.json();
            set({ items: json.data || [] });
          }
        } catch (err) {
          console.error('Failed to fetch cart from server:', err);
        }
      },
      syncCartToServer: async () => {
        const token = useCustomerAuth.getState().token;
        if (!token) return;

        const items = get().items;
        try {
          // Fetch current server cart to merge with local items
          const res = await fetch(`${API_URL}/api/cart`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const json = await res.json();
            const serverItems = json.data || [];
            
            // Create a map of server items for easy lookup
            const serverItemMap = new Map(
              serverItems.map((item: any) => [item.id, item])
            );

            // Add or update items from local cart
            for (const item of items) {
              const existingItem = serverItemMap.get(item.id);
              if (existingItem) {
                // Update quantity if item exists
                await fetch(`${API_URL}/api/cart/${item.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ 
                    quantity: item.quantity + existingItem.quantity 
                  }),
                });
              } else {
                // Add new item
                await fetch(`${API_URL}/api/cart`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ productId: item.id, quantity: item.quantity }),
                });
              }
            }
          } else {
            // If fetch fails, fall back to clearing and adding all items
            await fetch(`${API_URL}/api/cart`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            for (const item of items) {
              await fetch(`${API_URL}/api/cart`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ productId: item.id, quantity: item.quantity }),
              });
            }
          }
        } catch (err) {
          console.error('Failed to sync cart to server:', err);
        }
      },
    }),
    {
      name: 'macrostar-cart-storage',
    }
  )
);
