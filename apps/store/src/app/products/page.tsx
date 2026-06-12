'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ChevronDown, RefreshCw, X, Monitor, Laptop, Keyboard, Cpu, HardDrive } from 'lucide-react';
import ProductCard, { Product } from '@/components/ProductCard';
import { formatNaira } from '@/lib/utils';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        if (res.ok) {
          const json = await res.json();
          setCategoriesList(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Sync category from query params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (search) params.append('search', search);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (featuredOnly) params.append('featured', 'true');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '12'); // Display 12 items per page
      params.append('page', page.toString());

      const res = await fetch(`${API_URL}/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const json = await res.json();
      setProductsList(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to MacroStar server. Displaying offline products.');
      // Offline fallback products matching seed
      const offlineProducts = [
        { id: 1, name: 'HP Pavilion Desktop PC', slug: 'hp-pavilion-desktop-pc', shortDescription: 'Intel i5, 8GB RAM, 512GB SSD', price: '285000.00', comparePrice: '320000.00', stock: 8, images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'], featured: true, status: 'active', brand: 'HP', categorySlug: 'desktop-computers' },
        { id: 2, name: 'Lenovo ThinkBook 15 Laptop', slug: 'lenovo-thinkbook-15', shortDescription: 'AMD Ryzen 5, 16GB RAM, 256GB SSD', price: '420000.00', comparePrice: '480000.00', stock: 12, images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'], featured: true, status: 'active', brand: 'Lenovo', categorySlug: 'laptops' },
        { id: 3, name: 'Dell Inspiron 15 Laptop', slug: 'dell-inspiron-15', shortDescription: 'Intel i7, 16GB RAM, GTX 1650', price: '580000.00', comparePrice: '650000.00', stock: 6, images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'], featured: true, status: 'active', brand: 'Dell', categorySlug: 'laptops' },
        { id: 4, name: 'Intel Core i5-12400 Processor', slug: 'intel-core-i5-12400', shortDescription: '6-Core, 12-Thread, up to 4.4GHz', price: '95000.00', comparePrice: '110000.00', stock: 20, images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'], featured: false, status: 'active', brand: 'Intel', categorySlug: 'processors' },
        { id: 5, name: 'Kingston 16GB DDR4 RAM 3200MHz', slug: 'kingston-16gb-ddr4-3200', shortDescription: '16GB DDR4 3200MHz, CL16', price: '28000.00', comparePrice: '35000.00', stock: 35, images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'], featured: false, status: 'active', brand: 'Kingston', categorySlug: 'ram-memory' },
        { id: 6, name: 'NVIDIA RTX 4060 Graphics Card', slug: 'nvidia-rtx-4060', shortDescription: '8GB GDDR6, DLSS 3, Ray Tracing', price: '380000.00', comparePrice: '420000.00', stock: 5, images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop'], featured: true, status: 'active', brand: 'NVIDIA', categorySlug: 'graphics-cards' },
        { id: 8, name: 'Sony PlayStation 5 Console', slug: 'sony-playstation-5', shortDescription: 'PS5 Disc Edition, 825GB SSD', price: '680000.00', comparePrice: '750000.00', stock: 4, images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=600&auto=format&fit=crop'], featured: true, status: 'active', brand: 'Sony', categorySlug: 'gaming-consoles' },
        { id: 9, name: 'Windows 11 Pro Installation', slug: 'windows-11-pro-installation', shortDescription: 'Windows 11 Pro with activation', price: '15000.00', stock: 999, images: ['https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=600&auto=format&fit=crop'], featured: false, status: 'active', brand: 'Microsoft', categorySlug: 'software' }
      ];

      // Filter offline data locally to simulate api
      let filtered = offlineProducts;
      if (selectedCategory) {
        filtered = filtered.filter(p => p.categorySlug === selectedCategory || selectedCategory === 'all');
      }
      if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()));
      }
      if (minPrice) {
        filtered = filtered.filter(p => parseFloat(p.price) >= parseFloat(minPrice));
      }
      if (maxPrice) {
        filtered = filtered.filter(p => parseFloat(p.price) <= parseFloat(maxPrice));
      }
      if (sortBy === 'price') {
        filtered = filtered.sort((a, b) => sortOrder === 'asc' ? parseFloat(a.price) - parseFloat(b.price) : parseFloat(b.price) - parseFloat(a.price));
      } else {
        filtered = filtered.sort((a, b) => b.id - a.id);
      }
      setTotalPages(Math.ceil(filtered.length / 12) || 1);
      const paginated = filtered.slice((page - 1) * 12, page * 12);
      setProductsList(paginated);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, search, minPrice, maxPrice, featuredOnly, sortBy, sortOrder, page]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setFeaturedOnly(false);
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
    router.push('/products');
  };

  const defaultCategories = [
    { name: 'All Categories', slug: '' },
    { name: 'Laptops', slug: 'laptops' },
    { name: 'Desktops', slug: 'desktop-computers' },
    { name: 'Computer Parts', slug: 'computer-parts' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'Gaming Gear', slug: 'gaming' },
    { name: 'Software Installs', slug: 'software' },
    { name: 'Repairs & Services', slug: 'repairs-services' },
  ];

  const displayCategories = categoriesList.length > 0 ? [{ name: 'All Categories', slug: '' }, ...categoriesList] : defaultCategories;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">MacroStar Tech Catalog</h1>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Find genuine computers, laptop parts, gaming gear, repairs and software installs in Edo State.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Filters Sidebar */}
        <aside className={cn(
          'lg:col-span-1 space-y-6 bg-card border border-border/60 p-6 rounded-2xl h-fit',
          filterOpen ? 'block' : 'hidden lg:block'
        )}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
              <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
              <span>Filters</span>
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>Reset All</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Search Store</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search HP, SSD, PS5..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 pl-10 text-sm"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Categories select/list */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
            <div className="flex flex-col gap-1.5">
              {displayCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                  className={`text-left text-sm px-3 py-2 rounded-xl transition-all duration-200 ${
                    selectedCategory === cat.slug
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Price (₦ Naira)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₦"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
              <input
                type="number"
                placeholder="Max ₦"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Sort By Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Sort By</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setSortBy('price'); setSortOrder('asc'); setPage(1); }}
                className={`text-left text-xs px-3 py-2 rounded-lg border ${
                  sortBy === 'price' && sortOrder === 'asc'
                    ? 'border-primary text-primary font-bold bg-primary/5'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Price: Low to High
              </button>
              <button
                onClick={() => { setSortBy('price'); setSortOrder('desc'); setPage(1); }}
                className={`text-left text-xs px-3 py-2 rounded-lg border ${
                  sortBy === 'price' && sortOrder === 'desc'
                    ? 'border-primary text-primary font-bold bg-primary/5'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Price: High to Low
              </button>
              <button
                onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); setPage(1); }}
                className={`text-left text-xs px-3 py-2 rounded-lg border ${
                  sortBy === 'createdAt'
                    ? 'border-primary text-primary font-bold bg-primary/5'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Newest Arrivals
              </button>
            </div>
          </div>
        </aside>

        {/* Right Side: Product Grid */}
        <main id="products-scroll-container" className="lg:col-span-3 space-y-6 overflow-y-auto max-h-[75vh] pr-2 scroll-smooth pb-10">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-amber-200 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading MacroStar products...</p>
            </div>
          ) : productsList.length === 0 ? (
            <div className="text-center py-20 space-y-4 bg-card border border-border/40 rounded-3xl">
              <p className="text-muted-foreground">No products found matching your current filters.</p>
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsList.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => { 
                      setPage(Math.max(1, page - 1)); 
                      document.getElementById('products-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); 
                    }}
                    disabled={page === 1}
                    className="px-4 py-2 bg-card border border-border/60 rounded-xl disabled:opacity-50 hover:bg-muted transition-colors font-bold text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-bold text-muted-foreground mx-4">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => { 
                      setPage(Math.min(totalPages, page + 1)); 
                      document.getElementById('products-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); 
                    }}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-card border border-border/60 rounded-xl disabled:opacity-50 hover:bg-muted transition-colors font-bold text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading Store...</p>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
