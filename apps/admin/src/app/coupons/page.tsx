'use client';

import React, { useState, useEffect } from 'react';
import { Loader, Trash2, Edit2, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatNaira } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/coupons`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setCoupons(data);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoint = editingId ? `/api/coupons/${editingId}` : '/api/coupons';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          expiresAt: formData.expiresAt || null,
        }),
      });

      if (!response.ok) throw new Error();
      toast.success(editingId ? 'Coupon updated' : 'Coupon created');
      resetForm();
      fetchCoupons();
    } catch {
      toast.error('Failed to save coupon');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;

    try {
      const response = await fetch(`${API_URL}/api/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
      });

      if (!response.ok) throw new Error();
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const resetForm = () => {
    setFormData({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiresAt: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage discount codes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-card border border-border rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="SUMMER20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount (₦)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Discount Value</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Uses</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Unlimited"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Expires At</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
              {editingId ? 'Update' : 'Create'} Coupon
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-border rounded-lg hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No coupons yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-semibold">Code</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">Value</th>
                <th className="text-left px-4 py-3 font-semibold">Used</th>
                <th className="text-left px-4 py-3 font-semibold">Expires</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono font-bold">{coupon.code}</td>
                  <td className="px-4 py-3 capitalize">{coupon.discountType.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : formatNaira(coupon.discountValue)}
                  </td>
                  <td className="px-4 py-3">{coupon.usedCount}/{coupon.maxUses || '∞'}</td>
                  <td className="px-4 py-3 text-xs">
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditingId(coupon.id);
                        setFormData({
                          code: coupon.code,
                          discountType: coupon.discountType,
                          discountValue: coupon.discountValue,
                          maxUses: coupon.maxUses?.toString() || '',
                          expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
                        });
                        setShowForm(true);
                      }}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600 inline-block"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600 inline-block ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
