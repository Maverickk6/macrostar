'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { formatNaira } from '@/lib/utils';
import { CreditCard, Landmark, Truck, ShoppingBag, Landmark as BankIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CouponInput } from '@/components/coupon-input';
import { ShippingSelect } from '@/components/shipping-select';
import { NIGERIA_STATES } from '@/lib/nigeria-states';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon & Shipping State
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingData, setShippingData] = useState<any>(null);

  // Processing state
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <p className="text-muted-foreground text-sm">Your cart is empty. Add products to checkout.</p>
        <button
          onClick={() => router.push('/products')}
          className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const finalShippingFee = deliveryMethod === 'pickup' ? 0 : shippingFee;
  const total = subtotal + finalShippingFee - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error('Please fill in your name, email, and phone number.');
      return;
    }
    if (deliveryMethod === 'delivery' && !street) {
      toast.error('Please fill in your delivery street address.');
      return;
    }
    if (deliveryMethod === 'delivery' && finalShippingFee === 0) {
      toast.error('Please select a valid delivery location.');
      return;
    }

    setSubmitting(true);
    toast.loading('Creating order...');

    const orderPayload = {
      customer: { name, email, phone },
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      shippingAddress: {
        street: deliveryMethod === 'pickup' ? 'Opposite First Bank PLC' : street,
        city: deliveryMethod === 'pickup' ? 'Ekpoma' : city,
        state: deliveryMethod === 'pickup' ? 'Edo' : state,
        country: 'Nigeria',
      },
      couponCode: appliedCoupon?.code || null,
      discountAmount: discountAmount,
      shippingFee: finalShippingFee,
      notes: notes || `Method: ${deliveryMethod}`,
    };

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      toast.dismiss();

      if (!res.ok) throw new Error('Order creation failed on backend');

      const json = await res.json();
      const order = json.data;

      // Apply coupon if used
      if (appliedCoupon) {
        try {
          await fetch(`${API_URL}/api/coupons/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: appliedCoupon.code }),
          });
        } catch (err) {
          console.error('Failed to increment coupon usage');
        }
      }

      toast.success('Order created successfully!');
      router.push(`/payment?orderId=${order.id}&email=${encodeURIComponent(email)}&amount=${total}`);
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error('Connection to backend failed. Creating offline mockup order...');

      const mockOrderId = Math.floor(Math.random() * 10000);
      setTimeout(() => {
        router.push(`/payment?orderId=${mockOrderId}&email=${encodeURIComponent(email)}&amount=${total}&offline=true`);
      }, 1000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete your shipping information and proceed to payment.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold">1. Customer Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +234 80 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold">2. Delivery Preference</h2>

            {/* Selector */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 text-center transition-all ${
                  deliveryMethod === 'delivery'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Truck className="h-5 w-5" />
                <span className="text-sm font-bold">Standard Delivery</span>
                <span className="text-xs text-muted-foreground">Calculated by state</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 text-center transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <BankIcon className="h-5 w-5" />
                <span className="text-sm font-bold">Store Pick-up</span>
                <span className="text-xs text-muted-foreground">Free — Ekpoma Branch</span>
              </button>
            </div>

            {deliveryMethod === 'delivery' ? (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Street Address</label>
                  <input
                    type="text"
                    required={deliveryMethod === 'delivery'}
                    placeholder="e.g. 12 Main Street, opposite school gate"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">City</label>
                    <input
                      type="text"
                      required={deliveryMethod === 'delivery'}
                      placeholder="Ekpoma"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">State</label>
                    <select
                      required={deliveryMethod === 'delivery'}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm appearance-none"
                    >
                      <option value="">Select a state...</option>
                      {NIGERIA_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-2 pt-4">
                <div className="flex gap-2 text-xs font-bold text-primary">
                  <Landmark className="h-4 w-4" />
                  <span>Store Pick-up Location:</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  MacroStar Technologies, Opposite First Bank PLC, Ekpoma, Edo State.
                  Please bring identification and your order number when picking up.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-4">
              <label className="text-xs font-bold text-muted-foreground uppercase">Order Notes (Optional)</label>
              <textarea
                placeholder="Additional instructions, preferred pickup date, or computer model setup preferences..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm resize-none"
              />
            </div>
          </div>

          {/* Coupon Section */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold">3. Apply Coupon</h2>
            <CouponInput
              cartTotal={subtotal}
              appliedCoupon={appliedCoupon}
              onApply={(coupon) => {
                setAppliedCoupon(coupon);
                setDiscountAmount(coupon.discountAmount);
              }}
              onRemove={() => {
                setAppliedCoupon(null);
                setDiscountAmount(0);
              }}
            />
          </div>

          {/* Shipping Calculation */}
          {deliveryMethod === 'delivery' && (
            <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold">4. Shipping Calculation</h2>
              <ShippingSelect
                state={state}
                city={city}
                onSelect={(shipping) => {
                  setShippingFee(parseFloat(shipping.shippingFee));
                  setShippingData(shipping);
                }}
              />
            </div>
          )}
        </div>

        {/* Right: Checkout Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold border-b border-border/50 pb-3">Item Breakdown</h2>

            {/* List */}
            <div className="divide-y divide-border/40 max-h-48 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between text-xs gap-3">
                  <div className="line-clamp-2">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-foreground shrink-0">
                    {formatNaira(parseFloat(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-border/50 pt-4 space-y-3.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>{formatNaira(shippingFee)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatNaira(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/50 pt-3 text-sm font-extrabold text-foreground">
                <span>Total Payment due</span>
                <span className="text-primary text-base">{formatNaira(total)}</span>
              </div>
            </div>

            {/* Pay button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-50"
            >
              <CreditCard className="h-4.5 w-4.5" />
              <span>{submitting ? 'Creating Order...' : 'Proceed to Paystack'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
