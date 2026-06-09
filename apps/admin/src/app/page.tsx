'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useAuth';
import {
  TrendingUp,
  ShoppingBag,
  Boxes,
  Users,
  Compass,
  Landmark,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SummaryData {
  totalOrders: number;
  totalRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  pendingOrders: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const token = useAuth((state) => state.token);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Summary
        const summaryRes = await fetch(`${API_URL}/api/analytics/summary`, { headers });
        const summaryJson = await summaryRes.json();

        // 2. Fetch Sales Chart
        const salesRes = await fetch(`${API_URL}/api/analytics/sales?days=7`, { headers });
        const salesJson = await salesRes.json();

        // 3. Fetch Recent Orders
        const recentRes = await fetch(`${API_URL}/api/analytics/recent-orders?limit=5`, { headers });
        const recentJson = await recentRes.json();

        if (summaryRes.ok && salesRes.ok && recentRes.ok) {
          setSummary(summaryJson.data);
          setSalesData(salesJson.data);
          setRecentOrders(recentJson.data);
          setError(null);
        } else {
          throw new Error('Analytics failed');
        }
      } catch (err) {
        console.error(err);
        setError('Connected in Offline Mode. Displaying simulation dashboard.');

        // Sandbox Simulator Data
        setSummary({
          totalOrders: 154,
          totalRevenue: 2845000.0,
          monthOrders: 42,
          monthRevenue: 850000.0,
          todayOrders: 3,
          todayRevenue: 295000.0,
          totalProducts: 10,
          lowStockCount: 2,
          pendingOrders: 5,
        });

        setSalesData([
          { date: 'May 26', orders: 4, revenue: 120000 },
          { date: 'May 27', orders: 7, revenue: 380000 },
          { date: 'May 28', orders: 9, revenue: 420000 },
          { date: 'May 29', orders: 12, revenue: 580000 },
          { date: 'May 30', orders: 15, revenue: 710000 },
          { date: 'May 31', orders: 22, revenue: 980000 },
          { date: 'Jun 01', orders: 3, revenue: 295000 },
        ]);

        setRecentOrders([
          { id: 1045, orderNumber: 'MST-K8SJ9-1Y', guestName: 'Adebayo Tunde', guestEmail: 'ade@example.com', total: '422500.00', status: 'processing', paymentStatus: 'paid', createdAt: new Date().toISOString() },
          { id: 1044, orderNumber: 'MST-O92JF-4K', guestName: 'Efe Osas', guestEmail: 'efe@example.com', total: '28000.00', status: 'confirmed', paymentStatus: 'paid', createdAt: new Date().toISOString() },
          { id: 1043, orderNumber: 'MST-A82HD-9Z', guestName: 'John Doe', guestEmail: 'john@example.com', total: '95000.00', status: 'pending', paymentStatus: 'pending', createdAt: new Date().toISOString() },
          { id: 1042, orderNumber: 'MST-Y28FH-3X', guestName: 'Chidi Okafor', guestEmail: 'chidi@example.com', total: '682500.00', status: 'shipped', paymentStatus: 'paid', createdAt: new Date().toISOString() },
          { id: 1041, orderNumber: 'MST-L19KJ-0W', guestName: 'Mariam Ali', guestEmail: 'ali@example.com', total: '15000.00', status: 'delivered', paymentStatus: 'paid', createdAt: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Compiling sales metrics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Sales Revenue',
      value: formatNaira(summary?.totalRevenue || 0),
      desc: 'Overall completed paid orders',
      icon: TrendingUp,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Active Orders',
      value: summary?.totalOrders || 0,
      desc: `${summary?.pendingOrders} orders pending action`,
      icon: Compass,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'Catalog Items',
      value: summary?.totalProducts || 0,
      desc: 'Active products listed on storefront',
      icon: ShoppingBag,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      title: 'Low Stock Alarms',
      value: summary?.lowStockCount || 0,
      desc: 'Products below stock threshold',
      icon: Boxes,
      color: summary?.lowStockCount && summary.lowStockCount > 0 ? 'text-amber-500 bg-amber-500/10 animate-pulse' : 'text-neutral-500 bg-neutral-500/10',
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Alert */}
      {error && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-amber-200 text-xs flex gap-2">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Greeting Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight">System Overview</h1>
          <p className="text-xs text-muted-foreground">Real-time metrics for MacroStar branch in Ekpoma, Edo State.</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-muted-foreground uppercase">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-2xl font-black text-foreground">{card.value}</span>
                <p className="text-[10px] text-muted-foreground font-medium">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Graph & Stock alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graph Card */}
        <div className="lg:col-span-2 bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Revenue Graph (Last 7 Days)</h2>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                <YAxis stroke="rgba(255,255,255,0.4)" />
                <Tooltip
                  contentStyle={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small action panel / branch pickup summary */}
        <div className="lg:col-span-1 bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Store Branch Details</h2>
            <div className="p-4 bg-muted/40 rounded-xl space-y-3.5 text-xs">
              <div className="flex gap-2">
                <Landmark className="h-4.5 w-4.5 text-primary shrink-0" />
                <span className="font-bold text-foreground">Opposite First Bank PLC, Ekpoma</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Repairs, computer component inventory, and installations are handled at this main desk location in Edo State.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border/40">
            <button
              onClick={() => router.push('/inventory')}
              className="w-full flex items-center justify-between p-3.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-xs font-bold text-primary rounded-xl transition-all"
            >
              <span>Scan Critical Low Stock</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders table */}
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Recent Inbound Orders</h2>
          <button
            onClick={() => router.push('/orders')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>All Orders</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase border-b border-border/50">
                <th className="p-4">Order Number</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{ord.orderNumber}</td>
                  <td className="p-4">
                    <span className="block font-semibold text-foreground">{ord.guestName}</span>
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
                  <td className="p-4">
                    <span className={`text-[10px] font-bold capitalize ${ord.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => router.push(`/orders?id=${ord.id}`)}
                      className="px-3 py-1 bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-bold rounded-lg transition-colors border border-border"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
