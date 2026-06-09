'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/store/useAuth';
import { Compass, Search, RefreshCw, Eye, Landmark } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Order {
  id: number;
  orderNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  total: string;
  trackingNumber: string | null;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const token = useAuth((state) => state.token);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Order for Edit Panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setOrders(json.data || []);
        setError(null);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      setError('Displaying simulated orders logs.');
      // Local mockup matching seeds
      setOrders([
        { id: 1045, orderNumber: 'MST-K8SJ9-1Y', guestName: 'Adebayo Tunde', guestEmail: 'ade@example.com', guestPhone: '08033333333', status: 'processing', paymentStatus: 'paid', total: '422500.00', trackingNumber: 'TRK-9812', createdAt: new Date().toISOString() },
        { id: 1044, orderNumber: 'MST-O92JF-4K', guestName: 'Efe Osas', guestEmail: 'efe@example.com', guestPhone: '09012345678', status: 'confirmed', paymentStatus: 'paid', total: '28000.00', trackingNumber: null, createdAt: new Date().toISOString() },
        { id: 1043, orderNumber: 'MST-A82HD-9Z', guestName: 'John Doe', guestEmail: 'john@example.com', guestPhone: '08098765432', status: 'pending', paymentStatus: 'pending', total: '95000.00', trackingNumber: null, createdAt: new Date().toISOString() },
        { id: 1042, orderNumber: 'MST-Y28FH-3X', guestName: 'Chidi Okafor', guestEmail: 'chidi@example.com', guestPhone: '08044444444', status: 'shipped', paymentStatus: 'paid', total: '682500.00', trackingNumber: 'TRK-2244', createdAt: new Date().toISOString() },
        { id: 1041, orderNumber: 'MST-L19KJ-0W', guestName: 'Mariam Ali', guestEmail: 'ali@example.com', guestPhone: '08122222222', status: 'delivered', paymentStatus: 'paid', total: '15000.00', trackingNumber: 'TRK-0021', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    const payload = {
      status: newStatus,
      paymentStatus: newPaymentStatus,
      trackingNumber: trackingNumber || null,
    };

    try {
      const res = await fetch(`${API_URL}/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Update failed');

      toast.success('Order status updated!');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      toast.info('Simulated local order update.');
      setOrders(orders.map((o) =>
        o.id === selectedOrder.id ? { ...o, ...payload, status: payload.status as any, paymentStatus: payload.paymentStatus as any } : o
      ));
      setSelectedOrder(null);
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectOrder = async (ord: Order) => {
    setSelectedOrder(ord);
    setNewStatus(ord.status);
    setNewPaymentStatus(ord.paymentStatus);
    setTrackingNumber(ord.trackingNumber || '');
    setOrderItems([]);

    try {
      const res = await fetch(`${API_URL}/api/orders/${ord.id}`);
      if (res.ok) {
        const json = await res.json();
        setOrderItems(json.data.items || []);
      } else {
        throw new Error('Not found');
      }
    } catch (err) {
      console.error(err);
      // Local simulated order items
      setOrderItems([
        { id: 1, productName: 'Mock Purchased Tech Component', quantity: 1, unitPrice: ord.total, total: ord.total }
      ]);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.guestName.toLowerCase().includes(search.toLowerCase()) ||
      o.guestEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-8 text-sm">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          <span>Inbound Sales Orders</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage customer deliveries, tracking codes, and status updates.</p>
      </div>

      {error && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-amber-200 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search orders by number, name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-card border border-border rounded-xl px-4 py-2 text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Updating orders list...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border/40 rounded-2xl">
              <p className="text-muted-foreground">No customer orders logged.</p>
            </div>
          ) : (
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase border-b border-border/50">
                      <th className="p-4">Reference</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Delivery</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 font-mono font-bold text-foreground">{ord.orderNumber}</td>
                        <td className="p-4">
                          <span className="font-semibold text-foreground block">{ord.guestName}</span>
                          <span className="text-[10px] text-muted-foreground block">{ord.guestEmail}</span>
                        </td>
                        <td className="p-4 font-bold text-foreground">{formatNaira(ord.total)}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            ord.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                            ord.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' :
                            ord.status === 'processing' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-neutral-500/10 text-neutral-400'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleSelectOrder(ord)}
                            className="p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors border border-border"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map((ord) => (
                  <div key={ord.id} className="p-4 border-b border-border/40 last:border-b-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p className="font-mono font-bold text-foreground text-sm">{ord.orderNumber}</p>
                        <p className="font-semibold text-foreground text-sm">{ord.guestName}</p>
                        <p className="text-[10px] text-muted-foreground">{ord.guestEmail}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${
                        ord.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                        ord.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' :
                        ord.status === 'processing' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-neutral-500/10 text-neutral-400'
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{formatNaira(ord.total)}</span>
                      <button
                        onClick={() => handleSelectOrder(ord)}
                        className="p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors border border-border"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Update Panel */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <form onSubmit={handleUpdateStatus} className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-right duration-200">
              <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Update Order #{selectedOrder.orderNumber}</h2>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Delivery Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2 text-foreground"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Payment Status</label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2 text-foreground"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Waybill / Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. TRK-4812-Ekpoma"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
                />
              </div>

              {/* Items list */}
              {orderItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Purchased Items</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto divide-y divide-border/20 text-xs">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between gap-2">
                        <div>
                          <span className="font-semibold text-foreground block">{item.productName}</span>
                          <span className="text-[10px] text-muted-foreground">Qty: {item.quantity} x {formatNaira(item.unitPrice)}</span>
                        </div>
                        <span className="font-bold text-foreground self-center shrink-0">{formatNaira(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-grow py-3 bg-primary text-primary-foreground font-black rounded-xl text-xs"
                >
                  {updating ? 'Updating...' : 'Save Order State'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-3 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-card/40 border border-border/40 p-6 rounded-2xl text-center text-muted-foreground py-16">
              Select an order from the list to update its delivery tracking or billing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
