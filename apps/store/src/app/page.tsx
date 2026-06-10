import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Monitor, Laptop, Wrench, Settings, ArrowRight, ShieldCheck, Landmark, ShieldAlert, Cpu } from 'lucide-react';
import ProductCard, { Product } from '@/components/ProductCard';
import HeroImage from '@/components/HeroImage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products?featured=true&limit=4`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('API fetch failed');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Failed to fetch featured products, using fallbacks', err);
    // Fallback Mock Data matching the seed data
    return [
      {
        id: 1,
        name: 'HP Pavilion Desktop PC',
        slug: 'hp-pavilion-desktop-pc',
        shortDescription: 'Intel i5, 8GB RAM, 512GB SSD',
        price: '285000.00',
        comparePrice: '320000.00',
        stock: 8,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'],
        featured: true,
        status: 'active',
        brand: 'HP',
      },
      {
        id: 2,
        name: 'Lenovo ThinkBook 15 Laptop',
        slug: 'lenovo-thinkbook-15',
        shortDescription: 'AMD Ryzen 5, 16GB RAM, 256GB SSD',
        price: '420000.00',
        comparePrice: '480000.00',
        stock: 12,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'],
        featured: true,
        status: 'active',
        brand: 'Lenovo',
      },
      {
        id: 3,
        name: 'Dell Inspiron 15 Laptop',
        slug: 'dell-inspiron-15',
        shortDescription: 'Intel i7, 16GB RAM, GTX 1650',
        price: '580000.00',
        comparePrice: '650000.00',
        stock: 6,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'],
        featured: true,
        status: 'active',
        brand: 'Dell',
      },
      {
        id: 8,
        name: 'Sony PlayStation 5 Console',
        slug: 'sony-playstation-5',
        shortDescription: 'PS5 Disc Edition, 825GB SSD',
        price: '680000.00',
        comparePrice: '750000.00',
        stock: 4,
        images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=600&auto=format&fit=crop'],
        featured: true,
        status: 'active',
        brand: 'Sony',
      }
    ];
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  const services = [
    {
      title: 'Expert PC Repairs',
      description: 'Laptops, desktop repairs, heating fixes, screen replacements, motherboard troubleshooting.',
      icon: Wrench,
      slug: 'repairs-services'
    },
    {
      title: 'OS & Software Installs',
      description: 'Genuine Windows 10/11 installation, Microsoft Office activation, developer tools, professional games.',
      icon: Settings,
      slug: 'software'
    },
    {
      title: 'Gaming Gear & Consoles',
      description: 'Sony PS4, PS5 consoles, custom controllers, high-end PC gaming components setup.',
      icon: Cpu,
      slug: 'gaming'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 border-b border-border/50">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <HeroImage />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-wide backdrop-blur-sm">
              <Landmark className="h-3.5 w-3.5" />
              <span>Ekpoma's Premier Computer Hub</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-foreground">
              Upgrade Your Tech at{' '}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                MacroStar
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              We sell laptops, desktop computers, quality components, and gaming accessories. Visit us opposite First Bank PLC, Ekpoma for professional repairs & installations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3.5 border border-border bg-card/80 backdrop-blur-sm hover:bg-muted font-bold rounded-xl transition-all duration-300"
              >
                <span>Book a Service</span>
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="absolute h-72 w-72 bg-primary/20 rounded-full blur-3xl -z-10" />
            <div className="glass rounded-3xl p-8 max-w-md w-full border border-border shadow-2xl relative backdrop-blur-md bg-card/80">
              <span className="absolute -top-3 -right-3 bg-primary text-primary-foreground font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg">
                ₦ Naira Store
              </span>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-primary/10 rounded-2xl text-primary">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground">MacroStar Technologies</h3>
                    <p className="text-xs text-muted-foreground">Office location & store details</p>
                  </div>
                </div>
                <div className="space-y-3.5 text-sm border-t border-border/50 pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-bold text-foreground text-right">Opposite First Bank PLC, Ekpoma</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State:</span>
                    <span className="font-bold text-foreground">Edo State, Nigeria</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Core Services:</span>
                    <span className="font-bold text-foreground">Sales, Repairs, Installs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Featured Products</h2>
            <p className="text-sm text-muted-foreground">Top quality laptops, parts and game consoles in Naira</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline self-start sm:self-auto"
          >
            <span>View all products</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Core Services Section */}
      <section className="bg-card/40 border-t border-b border-border/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight">Professional Services</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Beyond product sales, we offer expert installation, repairs and support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <div key={idx} className="glass rounded-2xl p-6 space-y-4 hover:border-primary/50 transition-colors duration-300">
                  <div className="inline-flex p-3 bg-primary/10 rounded-xl text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">{svc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
                  <Link
                    href={`/products?category=${svc.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Learn more</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location Promo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl p-8 sm:p-12 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Visit Our Physical Store in Ekpoma</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We are conveniently located directly opposite First Bank PLC on the main street of Ekpoma, Edo State. Stop by today for instant repair assessments, laptop setups, and to test computer parts before buying.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>Full warranty on all device diagnostics & computer repairs</span>
            </div>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all duration-300 shrink-0 shadow-lg shadow-primary/10"
          >
            Get Directions & Details
          </Link>
        </div>
      </section>
    </div>
  );
}
