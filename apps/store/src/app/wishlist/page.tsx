'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart, ArrowLeft, Zap } from 'lucide-react';
import { useWishlist } from '@/store/useWishlist';
import { useCart } from '@/store/useCart';
import { toast } from 'sonner';
import { formatNaira } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, toggleItem } = useWishlist();
  const { addItem } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading your wishlist...</p>
      </div>
    );
  }

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image,
      sku: item.sku,
      stock: item.stock,
    });
    toast.success(`${item.name} added to cart!`);
  };

  const handleRemove = (item: any) => {
    toggleItem(item);
    toast.success('Removed from wishlist');
  };

  const placeholderImage = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop';

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Your Wishlist</h1>
          <p className="text-muted-foreground mt-2">Save your favorite items to view them later</p>
        </div>

        <div className="text-center py-20 space-y-6 bg-card border border-border/40 rounded-3xl">
          <div className="mx-auto w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center text-muted-foreground">
            <Heart className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Your wishlist is empty</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start adding your favorite computer parts and electronics to save them for later
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Browse Products</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border font-bold rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total value of wishlist
  const totalValue = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6 space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Wishlist</h1>
          <p className="text-muted-foreground mt-2">{items.length} items saved</p>
        </div>

        {/* Wishlist Stats */}
        <div className="grid grid-cols-2 gap-4 sm:w-fit">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="text-lg font-bold">{items.length}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-xs text-primary">Total Value</p>
            <p className="text-lg font-bold text-primary">{formatNaira(totalValue.toFixed(2))}</p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((item) => {
          const imgUrl = item.image?.startsWith('/uploads')
            ? `${API_URL}${item.image}`
            : item.image || placeholderImage;

          const hasDiscount = item.comparePrice && parseFloat(item.comparePrice) > parseFloat(item.price);
          const discountPercent = hasDiscount
            ? Math.round(
                ((parseFloat(item.comparePrice!) - parseFloat(item.price)) /
                  parseFloat(item.comparePrice!)) *
                  100
              )
            : 0;

          return (
            <div
              key={item.id}
              className="group relative rounded-xl border border-border/60 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 transition-all duration-300 flex flex-col h-full"
            >
              {/* Image Container */}
              <Link href={`/products/${item.slug}`} className="relative block aspect-square bg-muted/20 overflow-hidden">
                {/* Discount Badge */}
                {hasDiscount && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded-full z-10 tracking-wider">
                    Save {discountPercent}%
                  </span>
                )}

                {/* Stock Badge */}
                {item.stock <= 0 ? (
                  <span className="absolute top-3 right-3 bg-neutral-900/90 text-neutral-400 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full z-10">
                    Out of Stock
                  </span>
                ) : item.stock <= 3 ? (
                  <span className="absolute top-3 right-3 bg-amber-600 text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded-full z-10 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Only {item.stock} Left
                  </span>
                ) : null}

                {/* Image */}
                <img
                  src={imgUrl}
                  alt={item.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </Link>

              {/* Content */}
              <div className="p-4 flex flex-col flex-grow space-y-3">
                {/* Name */}
                <Link href={`/products/${item.slug}`}>
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="space-y-1">
                  <p className="text-lg font-bold text-primary">{formatNaira(item.price)}</p>
                  {hasDiscount && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatNaira(item.comparePrice!)}
                    </p>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  {item.stock > 0 ? (
                    <>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            item.stock > 10
                              ? 'bg-green-500 w-full'
                              : item.stock > 5
                              ? 'bg-yellow-500 w-2/3'
                              : 'bg-red-500 w-1/3'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.stock} in stock</span>
                    </>
                  ) : (
                    <p className="text-xs text-red-600 font-semibold">Out of Stock</p>
                  )}
                </div>

                {/* Actions - Spacer to push to bottom */}
                <div className="flex-grow" />

                {/* Buttons */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock <= 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                  <button
                    onClick={() => handleRemove(item)}
                    className="p-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Shopping */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-border/50">
          <Link
            href="/products"
            className="px-6 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors text-center"
          >
            Continue Shopping
          </Link>
          <Link
            href="/cart"
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-center flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart
          </Link>
        </div>
      )}
    </div>
  );
}
