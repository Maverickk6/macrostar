'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Eye, Heart, Star } from 'lucide-react';
import { formatNaira, getProductImageUrl } from '@/lib/utils';
import { useCart } from '@/store/useCart';
import { useWishlist } from '@/store/useWishlist';
import { toast } from 'sonner';

export interface Product {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string;
  price: string;
  comparePrice?: string;
  stock: number;
  images: string[];
  featured: boolean;
  status: string;
  brand?: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const toggleItem = useWishlist((state) => state.toggleItem);
  const items = useWishlist((state) => state.items);

  const isInWishlist = items.some((item) => item.id === product.id);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || null,
      sku: null,
      stock: product.stock,
    });

    toast.success(`${product.name} added to cart!`, {
      description: 'Proceed to checkout to complete your purchase.',
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || null,
      sku: null,
      stock: product.stock,
    });

    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((parseFloat(product.comparePrice!) - parseFloat(product.price)) /
          parseFloat(product.comparePrice!)) *
          100
      )
    : 0;

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const imageUrl = getProductImageUrl(product.images?.[0] || null, product.name, apiURL);

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 transition-all duration-300 flex flex-col h-full">
      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-muted/20 overflow-hidden">
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded-full z-10 tracking-wider">
            Save {discountPercent}%
          </span>
        )}

        {/* Stock Badge */}
        {product.stock <= 0 ? (
          <span className="absolute top-3 right-3 bg-neutral-900/90 text-neutral-400 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full z-10 tracking-wider">
            Out of Stock
          </span>
        ) : product.stock <= 3 ? (
          <span className="absolute top-3 right-3 bg-amber-600 text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded-full z-10 tracking-wider">
            Only {product.stock} Left
          </span>
        ) : null}

        {/* Image */}
        {imageError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <Image
            src={imageUrl}
            alt={product.name}
            width={600}
            height={600}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay hover options */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={handleToggleWishlist}
            className={`p-3 rounded-full text-foreground transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 shadow-lg ${
              isInWishlist
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-background hover:bg-red-500 hover:text-white'
            }`}
            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-4.5 w-4.5 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="p-3 bg-primary hover:bg-primary-foreground hover:text-primary rounded-full text-primary-foreground transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 shadow-lg delay-75"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Brand */}
        {product.brand && (
          <span className="text-[10px] text-primary font-bold tracking-widest uppercase mb-1">
            {product.brand}
          </span>
        )}

        {/* Title */}
        <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors block mb-2">
          <h3 className="font-bold text-base text-foreground tracking-tight line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Short Desc */}
        {product.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 flex-grow">
            {product.shortDescription}
          </p>
        )}

        {/* Price & Cart CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
          <div className="flex flex-col">
            <span className="text-lg font-black text-foreground">
              {formatNaira(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatNaira(product.comparePrice!)}
              </span>
            )}
          </div>

          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold rounded-xl transition-all duration-300"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <span className="text-xs text-muted-foreground font-semibold bg-muted px-2.5 py-1.5 rounded-lg">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
