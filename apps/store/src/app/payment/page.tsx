'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, Landmark, CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { useCart } from '@/store/useCart';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCart((state) => state.clearCart);

  // Params
  const orderId = searchParams.get('orderId');
  const email = searchParams.get('email') || '';
  const amount = parseFloat(searchParams.get('amount') || '0');
  const isOffline = searchParams.get('offline') === 'true';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaystackPayment = async () => {
    if (isOffline) {
      // Simulate success
      setLoading(true);
      toast.loading('Simulating offline Paystack confirmation...');
      setTimeout(() => {
        toast.dismiss();
        setSuccess(true);
        clearCart();
        toast.success('Mock payment verified successfully!');
        setLoading(false);
      }, 1500);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount,
          orderId,
          callbackUrl: `${window.location.origin}/payment/callback?orderId=${orderId}`,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Payment initiation failed');

      // Redirect user to Paystack checkout URL
      window.location.href = json.data.authorizationUrl;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to payment gateway. Please try offline simulation mode.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4 space-y-8">
      {success ? (
        <div className="bg-card border border-border/60 rounded-3xl p-8 text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
            <CheckCircle className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black">Order Placed!</h2>
            <p className="text-sm text-muted-foreground">
              Thank you for shopping with MacroStar. Your payment has been received.
            </p>
          </div>
          <div className="p-4 bg-muted/40 rounded-xl space-y-2 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Reference:</span>
              <span className="font-bold text-foreground">#{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-bold text-foreground">{formatNaira(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-bold text-foreground">Ekpoma Store branch</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm"
            >
              Track Your Order Delivery
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 text-muted-foreground hover:text-foreground text-xs font-bold"
            >
              Back to Homepage
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Complete Payment</h2>
            <p className="text-sm text-muted-foreground">Choose a payment gateway below to fulfill order #{orderId}.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-2xl text-red-200 text-xs flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isOffline && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-amber-200 text-xs">
              ⚠️ You are running in offline/simulation mode. Click below to mock pay via Paystack test.
            </div>
          )}

          <div className="p-4 bg-muted/40 rounded-2xl space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Email:</span>
              <span className="font-bold text-foreground break-all">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Payable (Naira):</span>
              <span className="font-extrabold text-primary">{formatNaira(amount)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePaystackPayment}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 border border-primary bg-primary/5 hover:bg-primary/10 rounded-xl text-left transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                <div>
                  <span className="font-bold text-sm block">Paystack (Naira Card/Transfer)</span>
                  <span className="text-xs text-muted-foreground">Supports USSD, Visa, Verve & Bank Transfers</span>
                </div>
              </div>
              {loading ? (
                <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 text-primary" />
              )}
            </button>
          </div>

          <button
            onClick={() => router.push('/cart')}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground font-bold hover:underline"
          >
            Cancel Payment & Return to Cart
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading Payment checkout...</p>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
