'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, ShieldCheck, MapPin, Truck, RefreshCw, Star, Landmark, Heart } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useWishlist } from '@/store/useWishlist';
import { formatNaira, getProductImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: string;
  comparePrice: string | null;
  stock: number;
  images: string[];
  specs: Record<string, string>;
  brand: string | null;
  warranty: string | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  const addItem = useCart((state) => state.addItem);
  const toggleItem = useWishlist((state) => state.toggleItem);
  const items = useWishlist((state) => state.items);

  const isInWishlist = product ? items.some((item) => item.id === product.id) : false;

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/products/${slug}`);
        if (!res.ok) throw new Error('Product not found on server');
        const json = await res.json();
        setProduct(json.data);
        setError(null);
      } catch (err) {
        console.error(err);
        // Fallback Product Details matching seed products
        const offlineProducts: Record<string, ProductDetail> = {
          'hp-pavilion-desktop-pc': {
            id: 1,
            name: 'HP Pavilion Desktop PC',
            slug: 'hp-pavilion-desktop-pc',
            description: 'Powerful HP Pavilion desktop with Intel Core i5 processor, 8GB RAM, and 512GB SSD. Perfect for home and office use. Features integrated cooling systems, multiple connectivity ports, and a sleek keyboard-mouse combination.',
            shortDescription: 'Intel i5, 8GB RAM, 512GB SSD',
            price: '285000.00',
            comparePrice: '320000.00',
            stock: 8,
            images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'],
            specs: { Processor: 'Intel Core i5-12400', RAM: '8GB DDR4', Storage: '512GB NVMe SSD', OS: 'Windows 11 Home', Graphics: 'Intel UHD 730' },
            brand: 'HP',
            warranty: '1 Year',
          },
          'lenovo-thinkbook-15': {
            id: 2,
            name: 'Lenovo ThinkBook 15 Laptop',
            slug: 'lenovo-thinkbook-15',
            description: 'Business-grade Lenovo ThinkBook 15 with AMD Ryzen 5 processor, 16GB RAM, and a stunning Full HD display. Slim bezel design, long battery life, and high durability for professional work.',
            shortDescription: 'AMD Ryzen 5, 16GB RAM, 256GB SSD',
            price: '420000.00',
            comparePrice: '480000.00',
            stock: 12,
            images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'],
            specs: { Processor: 'AMD Ryzen 5 5500U', RAM: '16GB DDR4', Storage: '256GB NVMe SSD', Display: '15.6" FHD IPS', OS: 'Windows 11 Pro' },
            brand: 'Lenovo',
            warranty: '1 Year',
          },
          'dell-inspiron-15': {
            id: 3,
            name: 'Dell Inspiron 15 Laptop',
            slug: 'dell-inspiron-15',
            description: 'Versatile Dell Inspiron 15 laptop with Intel Core i7, 16GB RAM, and dedicated NVIDIA graphics for work and light gaming. Ideal for students, content creators, and remote developers.',
            shortDescription: 'Intel i7, 16GB RAM, GTX 1650',
            price: '580000.00',
            comparePrice: '650000.00',
            stock: 6,
            images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'],
            specs: { Processor: 'Intel Core i7-1255U', RAM: '16GB DDR4', Storage: '512GB SSD', Graphics: 'NVIDIA GTX 1650 4GB', Display: '15.6" FHD' },
            brand: 'Dell',
            warranty: '1 Year',
          },
          'sony-playstation-5': {
            id: 8,
            name: 'Sony PlayStation 5 Console',
            slug: 'sony-playstation-5',
            description: 'Sony PlayStation 5 Disc Edition — the next generation of gaming. Experience lightning-fast loading, haptic feedback, adaptive triggers, and high-fidelity 4K gaming.',
            shortDescription: 'PS5 Disc Edition, 825GB SSD',
            price: '680000.00',
            comparePrice: '750000.00',
            stock: 4,
            images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=600&auto=format&fit=crop'],
            specs: { CPU: 'AMD Zen 2, 8-core', GPU: 'AMD RDNA 2, 10.28 TFLOPS', RAM: '16GB GDDR6', Storage: '825GB Custom SSD', Resolution: 'Up to 8K', 'Frame Rate': 'Up to 120fps' },
            brand: 'Sony',
            warranty: '1 Year',
          }
        };

        if (offlineProducts[slug]) {
          setProduct(offlineProducts[slug]);
          setError('Offline Mode: Displaying saved product profile.');
        } else {
          setProduct({
            id: 999,
            name: slug.replace(/-/g, ' ').toUpperCase(),
            slug,
            description: 'Generic product listing. Connect Hono backend to view complete details.',
            shortDescription: 'Details page',
            price: '50000.00',
            comparePrice: null,
            stock: 10,
            images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'],
            specs: { Status: 'Demo' },
            brand: 'MacroStar',
            warranty: '90 Days',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-lg text-muted-foreground">Product not found.</p>
        <Link href="/products" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to catalog</span>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || null,
      sku: null,
      stock: product.stock,
    }, quantity);

    toast.success(`${quantity} x ${product.name} added to cart!`, {
      description: 'Review your selection in the Cart page.',
    });
  };

  const handleToggleWishlist = () => {
    if (!product) return;
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

  const placeholderImage = `https://via.placeholder.com/600x600/334155/e2e8f0?text=${encodeURIComponent(product.name.substring(0, 20))}`;
  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const imageUrl = getProductImageUrl(product.images?.[0] || null, product.name, apiURL);

  const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Go Back</span>
      </button>

      {/* Connection Mode Alert */}
      {error && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-amber-200 text-xs">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-card border border-border/60 rounded-3xl overflow-hidden shadow-lg relative">
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full z-10 uppercase tracking-wide">
                Special Offer
              </span>
            )}
            {imageError ? (
              <img
                src={placeholderImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <Image
                src={imageUrl}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover object-center"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </div>

        {/* Right Column: Info & Action Box */}
        <div className="space-y-6">
          {/* Brand */}
          {product.brand && (
            <span className="text-xs text-primary font-black tracking-widest uppercase bg-primary/10 px-3 py-1.5 rounded-lg w-fit block">
              {product.brand}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {product.name}
          </h1>

          {/* Pricing */}
          <div className="flex items-baseline gap-4 py-2">
            <span className="text-3xl font-black text-foreground">
              {formatNaira(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {formatNaira(product.comparePrice!)}
              </span>
            )}
          </div>

          {/* Stock status indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm font-semibold">
              {product.stock > 0 ? `${product.stock} items available in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-muted-foreground text-sm leading-relaxed border-l-2 border-primary/40 pl-4 py-1">
              {product.shortDescription}
            </p>
          )}

          {/* Add to Cart Actions */}
          {product.stock > 0 ? (
            <div className="p-6 bg-card border border-border/60 rounded-2xl space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">Quantity:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2 hover:bg-muted font-bold text-lg text-muted-foreground transition-colors"
                  >
                    -
                  </button>
                  <span className="px-5 font-bold text-sm text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3.5 py-2 hover:bg-muted font-bold text-lg text-muted-foreground transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleToggleWishlist}
                  aria-label={isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                  className={`flex items-center justify-center gap-2 px-4 py-4 border-2 rounded-xl font-bold transition-all duration-300 ${
                    isInWishlist
                      ? 'border-red-500 text-red-500 bg-red-500/10'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">{isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all duration-300"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Shopping Cart</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 text-muted-foreground text-sm rounded-xl text-center font-bold">
              This product is currently out of stock. Contact repair/services page for ordering parts.
            </div>
          )}

          {/* Extra details list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>{product.warranty ? `${product.warranty} Local Warranty` : 'MacroStar Quality Guarantee'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <span>Opposite First Bank PLC, Ekpoma</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span>Same-day store pickup in Ekpoma</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Technical Specifications Tabs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-border/50">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Product Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description || 'No detailed description available for this computer/part.'}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Specifications</h2>
          {Object.keys(product.specs || {}).length > 0 ? (
            <div className="border border-border/50 rounded-xl overflow-hidden divide-y divide-border/50 bg-card text-xs">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="grid grid-cols-3 p-3">
                  <span className="font-bold text-muted-foreground col-span-1">{key}</span>
                  <span className="text-foreground col-span-2 font-medium">{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No technical specifications listed.</p>
          )}
        </div>
      </section>
    </div>
  );
}
