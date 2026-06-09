'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, ArrowRight, Minus, Plus, ArrowLeft, Landmark } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { formatNaira } from '@/lib/utils';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCart();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-sm">Loading shopping cart...</p>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const shippingFee = subtotal > 0 ? 2500 : 0; // Flat shipping rate
  const total = subtotal + shippingFee;

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground mt-1">Review your computer parts and hardware before checking out.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 space-y-6 bg-card border border-border/40 rounded-3xl">
          <div className="mx-auto w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Browse our high-performance laptops, processors, consoles, or repairs services and add items.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-4">
              <span className="text-sm font-semibold text-muted-foreground">{items.length} items</span>
              <button
                onClick={clearCart}
                className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Items</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const firstImage = item.image;
                const imgUrl = firstImage && firstImage.trim()
                  ? firstImage.startsWith('/uploads')
                    ? `${apiURL}${firstImage}`
                    : firstImage
                  : `https://via.placeholder.com/600x600/334155/e2e8f0?text=${encodeURIComponent(item.name.substring(0, 20))}`;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border border-border/60 rounded-2xl gap-4 shadow-sm"
                  >
                    {/* Left: Image & Name */}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                        {imageErrors[item.id] ? (
                          <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Image
                            src={imgUrl}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors">
                          <Link href={`/products/${item.slug}`}>{item.name}</Link>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Price: {formatNaira(item.price)}</p>
                      </div>
                    </div>

                    {/* Middle & Right: Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      {/* Quantity Toggles */}
                      <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1.5 hover:bg-muted font-bold text-muted-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1.5 hover:bg-muted font-bold text-muted-foreground"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-foreground">
                          {formatNaira(parseFloat(item.price) * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6 shadow-md">
              <h2 className="text-lg font-bold border-b border-border/50 pb-3">Order Summary</h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping (Edo State Flat)</span>
                  <span className="font-medium text-foreground">{formatNaira(shippingFee)}</span>
                </div>

                <div className="flex justify-between border-t border-border/50 pt-4 text-base font-extrabold">
                  <span>Total Cost</span>
                  <span className="text-primary">{formatNaira(total)}</span>
                </div>
              </div>

              {/* Ekpoma Store Note */}
              <div className="p-3.5 bg-muted/40 rounded-xl flex gap-2.5 text-xs text-muted-foreground">
                <Landmark className="h-5 w-5 text-primary shrink-0" />
                <p>
                  Pick-up options available at our Ekpoma branch (opposite First Bank PLC). Enter details in Checkout.
                </p>
              </div>

              {/* Checkout Trigger */}
              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all duration-300"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="text-center">
                <Link href="/products" className="text-xs text-primary font-bold hover:underline">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
