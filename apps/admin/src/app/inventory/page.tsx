'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/store/useAuth';
import { Boxes, Plus, Minus, RefreshCw, Landmark, AlertTriangle } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface InventoryItem {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  lowStockThreshold: number;
}

export default function AdminInventoryPage() {
  const token = useAuth((state) => state.token);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [customStock, setCustomStock] = useState<Record<number, string>>({});

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setInventory(json.data || []);
        setError(null);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      setError('Displaying simulated inventory logs.');
      // Local mockup matching seeds
      setInventory([
        { id: 1, name: 'HP Pavilion Desktop PC', sku: 'MST-DT-001', stock: 8, lowStockThreshold: 3 },
        { id: 2, name: 'Lenovo ThinkBook 15 Laptop', sku: 'MST-LT-001', stock: 12, lowStockThreshold: 3 },
        { id: 3, name: 'Dell Inspiron 15 Laptop', sku: 'MST-LT-002', stock: 6, lowStockThreshold: 3 },
        { id: 4, name: 'Intel Core i5-12400 Processor', sku: 'MST-CPU-001', stock: 20, lowStockThreshold: 5 },
        { id: 5, name: 'Kingston 16GB DDR4 RAM 3200MHz', sku: 'MST-RAM-001', stock: 35, lowStockThreshold: 5 },
        { id: 6, name: 'NVIDIA RTX 4060 Graphics Card', sku: 'MST-GPU-001', stock: 5, lowStockThreshold: 2 },
        { id: 7, name: 'Samsung 1TB NVMe SSD', sku: 'MST-SSD-001', stock: 25, lowStockThreshold: 5 },
        { id: 8, name: 'Sony PlayStation 5 Console', sku: 'MST-CON-001', stock: 4, lowStockThreshold: 2 },
        { id: 9, name: 'Windows 11 Pro Installation', sku: 'MST-SW-001', stock: 999, lowStockThreshold: 0 },
        { id: 10, name: 'Laptop Repair Service', sku: 'MST-REP-001', stock: 999, lowStockThreshold: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const adjustStock = async (productId: number, change: number) => {
    setUpdatingId(productId);
    const payload = {
      change,
      reason: 'Manual adjustment',
      reference: 'Admin stock count audit',
    };

    try {
      const res = await fetch(`${API_URL}/api/inventory/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Stock adjustment failed');

      toast.success('Stock adjusted successfully!');
      fetchInventory();
    } catch (err) {
      console.error(err);
      toast.info('Simulated stock change.');
      setInventory(inventory.map((item) =>
        item.id === productId ? { ...item, stock: Math.max(0, item.stock + change) } : item
      ));
    } finally {
      setUpdatingId(null);
    }
  };

  const setStockDirectly = async (productId: number, newStock: number) => {
    const item = inventory.find((i) => i.id === productId);
    if (!item) return;

    const change = newStock - item.stock;
    if (change === 0) return;

    setUpdatingId(productId);
    const payload = {
      change,
      reason: 'Direct stock set',
      reference: 'Admin manual stock set',
    };

    try {
      const res = await fetch(`${API_URL}/api/inventory/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Stock update failed');

      toast.success('Stock updated successfully!');
      fetchInventory();
      setCustomStock((prev) => ({ ...prev, [productId]: '' }));
    } catch (err) {
      console.error(err);
      toast.info('Simulated stock change.');
      setInventory(inventory.map((i) =>
        i.id === productId ? { ...i, stock: Math.max(0, newStock) } : i
      ));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-8 text-sm">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Boxes className="h-6 w-6 text-primary" />
          <span>Warehouse Inventory</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Track hardware stock counts, alerts, and adjustments.</p>
      </div>

      {error && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-amber-200 text-xs">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Refreshing warehouse counts...</p>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase border-b border-border/50">
                  <th className="p-4">SKU</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Alert Limit</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4 text-right">Quick Add / Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {inventory.map((item) => {
                  const isLow = item.stock <= item.lowStockThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-mono text-xs font-bold text-muted-foreground">{item.sku || 'N/A'}</td>
                      <td className="p-4 font-semibold text-foreground">{item.name}</td>
                      <td className="p-4 text-xs font-semibold text-muted-foreground">{item.lowStockThreshold} units</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                          isLow ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-muted text-foreground'
                        }`}>
                          {isLow && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                          <span>{item.stock} units</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          disabled={updatingId === item.id}
                          onClick={() => adjustStock(item.id, -1)}
                          className="p-1.5 bg-muted hover:bg-red-500 hover:text-white rounded-lg border border-border transition-colors disabled:opacity-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={customStock[item.id] || item.stock}
                          onChange={(e) => setCustomStock((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          disabled={updatingId === item.id}
                          className="w-16 px-2 py-1.5 bg-muted border border-border rounded-lg text-center font-semibold disabled:opacity-50"
                        />
                        <button
                          disabled={updatingId === item.id}
                          onClick={() => adjustStock(item.id, 1)}
                          className="p-1.5 bg-muted hover:bg-emerald-500 hover:text-white rounded-lg border border-border transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        {customStock[item.id] && customStock[item.id] !== String(item.stock) && (
                          <button
                            disabled={updatingId === item.id}
                            onClick={() => setStockDirectly(item.id, parseInt(customStock[item.id]) || 0)}
                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            Set
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
