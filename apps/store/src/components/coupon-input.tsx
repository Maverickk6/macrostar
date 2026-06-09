'use client';

import React, { useState } from 'react';
import { Tag, Loader, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface CouponInputProps {
  cartTotal: number;
  onApply: (coupon: { code: string; discountAmount: number }) => void;
  onRemove: () => void;
  appliedCoupon?: { code: string; discountAmount: number } | null;
}

export function CouponInput({ cartTotal, onApply, onRemove, appliedCoupon }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          cartTotal: cartTotal.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Invalid coupon code');
        return;
      }

      const discountAmount = parseFloat(data.coupon.discountAmount);
      onApply({
        code: data.coupon.code,
        discountAmount,
      });

      toast.success(
        `Coupon applied! You saved ₦${discountAmount.toFixed(2)}`
      );
      setCode('');
    } catch (err) {
      toast.error('Failed to validate coupon');
    } finally {
      setIsLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Coupon Applied</p>
              <p className="text-sm text-green-700">{appliedCoupon.code}</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="text-sm text-green-700 hover:text-green-900 font-medium"
          >
            Remove
          </button>
        </div>
        <p className="text-sm font-semibold text-green-900">
          Discount: -₦{appliedCoupon.discountAmount.toFixed(2)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Promo Code</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter coupon code"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleValidate}
          disabled={isLoading || !code.trim()}
          className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          Apply
        </button>
      </div>
    </div>
  );
}

export default CouponInput;
