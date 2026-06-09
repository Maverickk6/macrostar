'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/store/useAuth';
import { Plus, Search, Edit2, Trash2, SlidersHorizontal, RefreshCw, X } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  comparePrice: string | null;
  stock: number;
  brand: string | null;
  status: 'active' | 'inactive' | 'out_of_stock';
  sku: string | null;
  images: string[];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const token = useAuth((state) => state.token);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Add Product Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stock, setStock] = useState('5');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [specs, setSpecs] = useState<Record<string, string>>({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/products?status=all`);
      const json = await res.json();

      const catRes = await fetch(`${API_URL}/api/categories/flat`);
      const catJson = await catRes.json();

      if (res.ok) {
        setProducts(json.data || []);
        setCategories(catJson.data || []);
        setError(null);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      setError('Displaying simulated inventory products.');
      // Local demo mock list matching seeds
      setProducts([
        { id: 1, name: 'HP Pavilion Desktop PC', slug: 'hp-pavilion-desktop-pc', price: '285000.00', comparePrice: '320000.00', stock: 8, brand: 'HP', status: 'active', sku: 'MST-DT-001', images: [] },
        { id: 2, name: 'Lenovo ThinkBook 15 Laptop', slug: 'lenovo-thinkbook-15', price: '420000.00', comparePrice: '480000.00', stock: 12, brand: 'Lenovo', status: 'active', sku: 'MST-LT-001', images: [] },
        { id: 3, name: 'Dell Inspiron 15 Laptop', slug: 'dell-inspiron-15', price: '580000.00', comparePrice: '650000.00', stock: 6, brand: 'Dell', status: 'active', sku: 'MST-LT-002', images: [] },
        { id: 4, name: 'Intel Core i5-12400 Processor', slug: 'intel-core-i5-12400', price: '95000.00', comparePrice: '110000.00', stock: 20, brand: 'Intel', status: 'active', sku: 'MST-CPU-001', images: [] },
        { id: 5, name: 'Kingston 16GB DDR4 RAM 3200MHz', slug: 'kingston-16gb-ddr4-3200', price: '28000.00', comparePrice: '35000.00', stock: 35, brand: 'Kingston', status: 'active', sku: 'MST-RAM-001', images: [] },
        { id: 6, name: 'NVIDIA RTX 4060 Graphics Card', slug: 'nvidia-rtx-4060', price: '380000.00', comparePrice: '420000.00', stock: 5, brand: 'NVIDIA', status: 'active', sku: 'MST-GPU-001', images: [] },
        { id: 7, name: 'Samsung 1TB NVMe SSD', slug: 'samsung-1tb-nvme-ssd', price: '72000.00', comparePrice: '85000.00', stock: 25, brand: 'Samsung', status: 'active', sku: 'MST-SSD-001', images: [] },
        { id: 8, name: 'Sony PlayStation 5 Console', slug: 'sony-playstation-5', price: '680000.00', comparePrice: '750000.00', stock: 4, brand: 'Sony', status: 'active', sku: 'MST-CON-001', images: [] },
        { id: 9, name: 'Windows 11 Pro Installation', slug: 'windows-11-pro-installation', price: '15000.00', comparePrice: null, stock: 999, brand: 'Microsoft', status: 'active', sku: 'MST-SW-001', images: [] },
        { id: 10, name: 'Laptop Repair Service', slug: 'laptop-repair-service', price: '10000.00', comparePrice: null, stock: 999, brand: null, status: 'active', sku: 'MST-REP-001', images: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = async (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(parseFloat(prod.price).toString());
    setComparePrice(prod.comparePrice ? parseFloat(prod.comparePrice).toString() : '');
    setStock(prod.stock.toString());
    setBrand(prod.brand || '');
    setSku(prod.sku || '');
    setDescription('');
    setCategoryId('');
    setImages(prod.images || []);
    setSpecs({});
    setShowAddForm(true);

    try {
      const res = await fetch(`${API_URL}/api/products/${prod.slug}`);
      if (res.ok) {
        const json = await res.json();
        setDescription(json.data.description || '');
        setCategoryId(json.data.categoryId ? json.data.categoryId.toString() : '');
        setSpecs(json.data.specs || {});
      }
    } catch (e) {
      console.error('Failed to pre-populate extra details:', e);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error('Product Name and Price are required.');
      return;
    }

    setSubmitting(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload = {
      name,
      slug,
      price: parseFloat(price).toFixed(2),
      comparePrice: comparePrice ? parseFloat(comparePrice).toFixed(2) : null,
      stock: parseInt(stock),
      brand: brand || null,
      sku: sku || `MST-AUTO-${Math.floor(Math.random() * 1000)}`,
      description: description || null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      status: 'active',
      images: images,
      specs: specs,
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Save failed');

      toast.success(editingProduct ? 'Product profile updated!' : 'Product added to catalog!');
      fetchProducts();
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.info(editingProduct ? 'Simulated local update.' : 'Simulated local addition.');
      if (editingProduct) {
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p) as any));
      } else {
        const newMockProd: Product = {
          id: Math.floor(Math.random() * 1000) + 11,
          ...payload,
          status: 'active',
          comparePrice: payload.comparePrice || null,
          brand: payload.brand,
          sku: payload.sku,
          images: [],
        };
        setProducts([newMockProd, ...products]);
      }
      setShowAddForm(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Delete failed');

      toast.success('Product deleted.');
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.info('Simulated deletion.');
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('folder', 'macrostar/products');

      const res = await fetch(`${API_URL}/api/upload/multiple`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const json = await res.json();
      setImages([...images, ...json.urls]);
      toast.success('Images uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setComparePrice('');
    setStock('5');
    setBrand('');
    setSku('');
    setDescription('');
    setCategoryId('');
    setImages([]);
    setSpecs({});
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Product Catalog</h1>
          <p className="text-xs text-muted-foreground">Manage active models, parts, gaming gear, prices, and specs.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-colors self-start sm:self-auto"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showAddForm ? 'Close Form' : 'New Product'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-amber-200 text-xs">
          {error}
        </div>
      )}

      {/* Add Product Form Collapse */}
      {showAddForm && (
        <form onSubmit={handleAddProduct} className="bg-card border border-border/60 p-6 rounded-2xl shadow-md space-y-4 animate-in slide-in-from-top duration-200 text-sm">
          <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
            {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product Details'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Product Title</label>
              <input
                type="text"
                required
                placeholder="HP EliteBook, Kingston RAM, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Price (₦ Naira)</label>
              <input
                type="number"
                required
                placeholder="250000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Compare Price (₦ Naira - Optional)</label>
              <input
                type="number"
                placeholder="300000"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Initial Stock Qty</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Brand (e.g. Dell)</label>
              <input
                type="text"
                placeholder="Dell"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">SKU Reference</label>
              <input
                type="text"
                placeholder="MST-LAP-023"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2 text-foreground"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
              <textarea
                placeholder="Technical specifications, features, warranty guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2 resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Specifications (Key-Value Pairs)</label>
              <div className="space-y-2">
                {Object.entries(specs).map(([key, value], index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Specification (e.g., OS, RAM, Processor)"
                      value={key}
                      onChange={(e) => {
                        const newSpecs = { ...specs };
                        delete newSpecs[key];
                        newSpecs[e.target.value] = value;
                        setSpecs(newSpecs);
                      }}
                      className="flex-1 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., Windows 11, 16GB, Intel i7)"
                      value={value}
                      onChange={(e) => {
                        setSpecs({ ...specs, [key]: e.target.value });
                      }}
                      className="flex-1 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSpecs = { ...specs };
                        delete newSpecs[key];
                        setSpecs(newSpecs);
                      }}
                      className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSpecs({ ...specs, '': '' })}
                  className="w-full py-2 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20"
                >
                  + Add Specification
                </button>
              </div>
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Product Images</label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="flex-1 text-xs bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
                  />
                  {uploadingImages && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`Product image ${index + 1}`}
                          width={96}
                          height={96}
                          className="w-full h-24 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs"
          >
            {submitting ? 'Saving...' : editingProduct ? 'Save Product Changes' : 'Create Product Profile'}
          </button>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow text-sm">
          <input
            type="text"
            placeholder="Search catalog by name, brand, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 pl-10"
          />
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
        </div>
      </div>

      {/* Catalog Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Retrieving catalog item status...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border/40 rounded-2xl">
          <p className="text-sm text-muted-foreground">No matching products in catalog.</p>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase border-b border-border/50">
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-muted-foreground">{prod.sku || 'N/A'}</td>
                    <td className="p-4">
                      <span className="font-semibold text-foreground block">{prod.name}</span>
                    </td>
                    <td className="p-4 font-bold text-foreground">{formatNaira(prod.price)}</td>
                    <td className="p-4">
                      <span className={`font-bold ${prod.stock <= 3 ? 'text-amber-400' : 'text-foreground'}`}>
                        {prod.stock} units
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-muted-foreground">{prod.brand || 'MacroStar'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(prod)}
                        className="p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors border border-border"
                        title="Edit product details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/20"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
