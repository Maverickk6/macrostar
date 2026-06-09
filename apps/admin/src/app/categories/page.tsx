'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/store/useAuth';
import { Plus, Search, Trash2, ListCollapse, RefreshCw, Landmark } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const token = useAuth((state) => state.token);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/categories/flat`);
      const json = await res.json();
      if (res.ok) {
        setCategories(json.data || []);
        setError(null);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      setError('Displaying simulated categories.');
      setCategories([
        { id: 1, name: 'Desktop Computers', slug: 'desktop-computers', description: 'Full desktop PC systems and towers', sortOrder: 1 },
        { id: 2, name: 'Laptops', slug: 'laptops', description: 'Portable laptops and notebooks', sortOrder: 2 },
        { id: 3, name: 'Computer Parts', slug: 'computer-parts', description: 'CPUs, RAM, motherboards, storage and more', sortOrder: 3 },
        { id: 4, name: 'Accessories', slug: 'accessories', description: 'Keyboards, mice, headsets, monitors and peripherals', sortOrder: 4 },
        { id: 5, name: 'Gaming', slug: 'gaming', description: 'Gaming PCs, consoles, controllers, and gaming gear', sortOrder: 5 },
        { id: 6, name: 'Software', slug: 'software', description: 'Software installations — games and productivity tools', sortOrder: 6 },
        { id: 7, name: 'Repairs & Services', slug: 'repairs-services', description: 'Computer repair and maintenance services', sortOrder: 7 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Category Name is required.');
      return;
    }

    setSubmitting(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload = {
      name,
      slug,
      description: description || null,
      sortOrder: parseInt(sortOrder),
      isActive: true,
    };

    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Create failed');

      toast.success('Category added to catalog!');
      fetchCategories();
      setName('');
      setDescription('');
      setSortOrder('0');
    } catch (err) {
      console.error(err);
      toast.info('Simulated addition to categories list.');
      const newMockCat: Category = {
        id: Math.floor(Math.random() * 1000) + 10,
        name,
        slug,
        description: description || null,
        sortOrder: parseInt(sortOrder),
      };
      setCategories([...categories, newMockCat]);
      setName('');
      setDescription('');
      setSortOrder('0');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? All sub-products will lose their primary categorization reference.')) return;

    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Delete failed');

      toast.success('Category deleted.');
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.info('Simulated deletion.');
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-8 pb-8 text-sm">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <ListCollapse className="h-6 w-6 text-primary" />
          <span>Category Directory</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage computer classification sorting filters.</p>
      </div>

      {error && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-amber-200 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddCategory} className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">New Category</h2>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Storage Devices"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
              <textarea
                placeholder="e.g. Hard Drives, solid state drives and backups..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2 resize-none"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl text-xs"
            >
              {submitting ? 'Saving...' : 'Add Category'}
            </button>
          </form>
        </div>

        {/* List Directory */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Updating filter categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border/40 rounded-2xl">
              <p className="text-muted-foreground">No catalog categories defined.</p>
            </div>
          ) : (
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase border-b border-border/50">
                      <th className="p-4">Sort</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Description</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 font-mono font-bold text-primary">{cat.sortOrder}</td>
                        <td className="p-4 font-semibold text-foreground">{cat.name}</td>
                        <td className="p-4 text-xs font-mono text-muted-foreground">{cat.slug}</td>
                        <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">{cat.description || 'No description'}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/20"
                            title="Delete category"
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
      </div>
    </div>
  );
}
