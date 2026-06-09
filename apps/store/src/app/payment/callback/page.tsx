'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCart((state) => state.clearCart);

  const reference = searchParams.get('reference');
  const orderId = searchParams.get('orderId');

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setErrorMessage('No payment reference found.');
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch(`${API_URL}/api/payments/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, orderId }),
        });

        const json = await res.json();

        if (res.ok && json.success) {
          setStatus('success');
          clearCart();
          toast.success('Payment received! Your order is being processed.');
          setTimeout(() => {
            router.push(`/orders/${orderId || reference}`);
          }, 3000);
        } else {
          throw new Error(json.message || 'Verification failed');
        }
      } catch (err: any) {
        console.error(err);
        setStatus('failed');
        setErrorMessage(err.message || 'Failed to verify transaction with bank.');
      }
    }

    verifyPayment();
  }, [reference, orderId]);

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center">
      <div className="bg-card border border-border/60 rounded-3xl p-8 space-y-6 shadow-xl">
        {status === 'verifying' && (
          <div className="space-y-4">
            <RefreshCw className="h-10 w-10 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold">Verifying Transaction</h2>
            <p className="text-sm text-muted-foreground">Checking payment status with Paystack secure servers...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold">Payment Confirmed</h2>
            <p className="text-sm text-muted-foreground">Redirecting you to order tracking page shortly.</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">Payment Error</h2>
            <p className="text-sm text-red-400">{errorMessage}</p>
            <button
              onClick={() => router.push('/cart')}
              className="mt-2 w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm"
            >
              Return to Shopping Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading gateway callback...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
