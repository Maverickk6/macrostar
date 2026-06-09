'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useCustomerAuth';
import { ShoppingBag, ChevronRight, Loader, AlertCircle, ArrowLeft, Eye } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Order {
  id: number;
  orderNumber: string;
  customerId: number | null;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
  shippingAddress?: any;
}

export default function OrdersPage() {
  const router = useRouter();
  const { customer, token, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!token || !customer) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [token, customer, mounted]);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setError(null);

      // For now, we'll use a mock customer ID (in production, decode from JWT)
      const customerId = customer?.id || 1;

      const response = await fetch(
        `${API_URL}/api/orders/customer/my-orders?customerId=${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (!token || !customer) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={`${config.bg} ${config.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground mt-2">Track and manage your purchases</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error Loading Orders</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {isLoadingOrders ? (
        <div className="text-center py-12">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border/40 rounded-3xl space-y-6">
          <div className="mx-auto w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">No orders yet</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemCount = order.items?.length || 0;
            const orderDate = formatDate(order.createdAt);

            return (
              <div
                key={order.id}
                className="border border-border/60 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 transition-all duration-300 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-5 bg-card border-b border-border/50 flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                    <p className="font-semibold text-lg">{formatNaira(order.total)}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{orderDate}</p>
                      <p className="text-sm font-medium">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                    </div>

                    {getStatusBadge(order.status)}

                    <Link
                      href={`/orders/${order.id}`}
                      className="p-2.5 rounded-lg hover:bg-muted transition-colors text-foreground"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="px-5 py-3 bg-muted/30 border-t border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground">
                        {order.items
                          .slice(0, 3)
                          .map((item: any, idx: number) => (
                            <span key={idx}>
                              {item.name}
                              {idx < Math.min(2, order.items!.length - 1) && ', '}
                            </span>
                          ))}
                        {order.items.length > 3 && (
                          <span> +{order.items.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Continue Shopping */}
      {orders.length > 0 && (
        <div className="flex justify-center pt-8 border-t border-border/50">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
