'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Truck, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatNaira } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ShippingZone {
  id: number;
  name: string;
  state: string;
  city?: string;
  baseRate: string;
  perKgRate: string;
  estimatedDays: number;
}

interface ShippingResult {
  state: string;
  city: string;
  shippingFee: string;
  estimatedDays: number;
  zone: ShippingZone;
}

interface ShippingSelectProps {
  state: string;
  city?: string;
  weight?: number;
  onSelect: (shipping: ShippingResult) => void;
}

export function ShippingSelect({ state, city, weight = 0, onSelect }: ShippingSelectProps) {
  const [selectedShipping, setSelectedShipping] = useState<ShippingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevStateRef = useRef<string>('');

  // Calculate shipping when state changes — but only when state is non-empty
  useEffect(() => {
    // Clear previous results and error when state changes
    if (state !== prevStateRef.current) {
      setError(null);
      setSelectedShipping(null);
      prevStateRef.current = state;
    }

    if (state) {
      calculateShipping();
    }
  }, [state, city, weight]);

  const calculateShipping = async () => {
    if (!state) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/shipping/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          city: city || state,
          weight,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate shipping');
      }

      setSelectedShipping(data);
      onSelect(data);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate shipping');
      toast.error(err.message || 'Shipping not available for this location');
    } finally {
      setIsLoading(false);
    }
  };

  if (!state) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
        Select a delivery state above to calculate shipping
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-900 dark:text-red-300">Shipping Unavailable</p>
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
        <button
          type="button"
          onClick={calculateShipping}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
          title="Retry"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-muted rounded-lg flex items-center justify-center gap-2">
        <Loader className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Calculating shipping for {state}...</span>
      </div>
    );
  }

  if (!selectedShipping) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
        Calculating shipping...
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-blue-900 dark:text-blue-200">{selectedShipping.zone.name}</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            📍 {selectedShipping.state}
            {selectedShipping.city ? ` - ${selectedShipping.city}` : ''}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            ⏱️ Estimated Delivery: {selectedShipping.estimatedDays} business day
            {selectedShipping.estimatedDays !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-blue-900 dark:text-blue-200">
            {formatNaira(selectedShipping.shippingFee)}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400">Shipping Fee</p>
        </div>
      </div>
    </div>
  );
}

export default ShippingSelect;
