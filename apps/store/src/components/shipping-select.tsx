'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Loader, AlertCircle } from 'lucide-react';
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
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch zones on mount
  useEffect(() => {
    fetchZones();
  }, []);

  // Calculate shipping when state changes
  useEffect(() => {
    if (state) {
      calculateShipping();
    }
  }, [state, city, weight]);

  const fetchZones = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shipping/zones`);
      if (!response.ok) throw new Error('Failed to fetch zones');
      const data = await response.json();
      setZones(data);
    } catch (err) {
      console.error('Error fetching zones:', err);
      setError('Failed to load shipping options');
    }
  };

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

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900">Shipping Unavailable</p>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-muted rounded-lg flex items-center justify-center gap-2">
        <Loader className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Calculating shipping...</span>
      </div>
    );
  }

  if (!selectedShipping) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
        Select a delivery state to calculate shipping
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <Truck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-blue-900">{selectedShipping.zone.name}</p>
          <p className="text-sm text-blue-700">
            📍 {selectedShipping.state}
            {selectedShipping.city ? ` - ${selectedShipping.city}` : ''}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            ⏱️ Estimated Delivery: {selectedShipping.estimatedDays} business day
            {selectedShipping.estimatedDays !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-blue-900">
            {formatNaira(selectedShipping.shippingFee)}
          </p>
          <p className="text-xs text-blue-700">Shipping Fee</p>
        </div>
      </div>
    </div>
  );
}

export default ShippingSelect;
