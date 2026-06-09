'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Truck, Landmark, ShoppingBag, Clock, HelpCircle, PackageCheck, AlertTriangle } from 'lucide-react';
import { formatNaira } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  total: string;
  shippingFee: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
  };
  notes: string | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  items: OrderItem[];
  createdAt: string;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/orders/${id}`);
        if (!res.ok) throw new Error('Order not found on server');
        const json = await res.json();
        setOrder(json.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Displaying offline tracking data.');

        // Build mock tracking details for offline testing
        setOrder({
          id: parseInt(id) || 1045,
          orderNumber: id.startsWith('MST') ? id : `MST-MOCK-${id}`,
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          guestPhone: '+234 80 1234 5678',
          status: 'processing', // Mock state
          paymentStatus: 'paid',
          total: '422500.00',
          shippingFee: '2500.00',
          shippingAddress: {
            street: 'Opposite First Bank PLC',
            city: 'Ekpoma',
            state: 'Edo',
          },
          notes: 'Method: pickup',
          trackingNumber: 'TRK-OFFLINE-9821',
          estimatedDelivery: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          items: [
            { id: 1, productName: 'Lenovo ThinkBook 15 Laptop', quantity: 1, unitPrice: '420000.00', total: '420000.00' }
          ],
          createdAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="animate-spin h-8 w-8 text-primary mx-auto border-4 border-t-transparent border-primary/20 rounded-full" />
        <p className="text-muted-foreground text-sm">Retrieving order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-lg font-bold">Order not found</h2>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-primary rounded-xl text-xs font-bold text-white">
          Return to Home
        </button>
      </div>
    );
  }

  // Delivery status step helper
  const steps = [
    { label: 'Order Placed', status: 'pending', desc: 'Awaiting validation' },
    { label: 'Payment Paid', status: 'confirmed', desc: 'Securely confirmed' },
    { label: 'Processing', status: 'processing', desc: 'Tech prep & testing' },
    { label: 'Dispatched', status: 'shipped', desc: 'On its way' },
    { label: 'Delivered', status: 'delivered', desc: 'Completed successfully' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'pending') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'processing') return 2;
    if (status === 'shipped') return 3;
    if (status === 'delivered') return 4;
    return 2; // Default fallback
  };

  const currentStepIndex = getStepIndex(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header banner */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Delivery Status</span>
            {error && <span className="bg-amber-950/20 text-amber-300 border border-amber-800/40 text-[9px] font-bold px-2 py-0.5 rounded-full">{error}</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground break-all">
            Order Reference: <span className="text-primary">{order.orderNumber}</span>
          </h1>
          <p className="text-xs text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="bg-muted/40 p-4 rounded-2xl space-y-1 text-xs">
          <div className="flex gap-2">
            <span className="text-muted-foreground">Payment Status:</span>
            <span className={`font-bold capitalize ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">Order Total:</span>
            <span className="font-extrabold text-foreground">{formatNaira(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Interactive visual progress tracker */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold">Delivery Tracker</h2>

        {/* Timeline */}
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Timeline Connector Line */}
          <div className="absolute left-[17px] top-6 bottom-6 w-0.5 bg-border md:left-6 md:right-6 md:top-[17px] md:bottom-auto md:w-auto md:h-0.5 -z-10" />

          {/* Steps list */}
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <div key={idx} className="flex md:flex-col items-center md:items-start md:text-left gap-4 md:gap-3 flex-1 relative">
                {/* Step node indicator */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-sm shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-4.5 w-4.5" /> : idx + 1}
                </div>

                {/* Info */}
                <div>
                  <h3 className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {step.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Order details, items and locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: items breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span>Purchased Items</span>
            </h2>

            <div className="divide-y divide-border/50 text-sm">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-foreground">{item.productName}</h3>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Quantity: {item.quantity} x {formatNaira(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-extrabold text-foreground shrink-0">{formatNaira(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: delivery detail & map instructions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span>Delivery / Pick-up Details</span>
            </h2>

            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div className="space-y-1">
                <span className="font-bold text-foreground block">Customer Name</span>
                <span>{order.guestName}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-foreground block">Contact Phone</span>
                <span>{order.guestPhone}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-foreground block">Street Address</span>
                <span>{order.shippingAddress?.street}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-foreground block">City / State</span>
                <span>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} State
                </span>
              </div>

              {order.notes && (
                <div className="space-y-1">
                  <span className="font-bold text-foreground block">Order Notes</span>
                  <span>{order.notes}</span>
                </div>
              )}

              {order.trackingNumber && (
                <div className="space-y-1">
                  <span className="font-bold text-foreground block">Store Carrier Tracking ID</span>
                  <span className="font-mono text-foreground font-semibold uppercase">{order.trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pickup address instructions */}
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-3">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              <Landmark className="h-4.5 w-4.5" />
              <span>Branch Pick-up Info</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For Pick-up orders, visit our main office opposite First Bank PLC, Ekpoma, Edo State.
              Store is open Monday - Saturday, 9:00 AM - 6:00 PM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
