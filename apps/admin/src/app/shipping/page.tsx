'use client';

import React, { useState, useEffect } from 'react';
import { Loader, Trash2, Edit2, Plus, AlertCircle } from 'lucide-react';
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
  isActive: boolean;
}

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    city: '',
    baseRate: '',
    perKgRate: '',
    estimatedDays: '3',
  });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/shipping/zones`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setZones(data);
    } catch {
      toast.error('Failed to load zones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoint = editingId ? `/api/shipping/zones/${editingId}` : '/api/shipping/zones';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          state: formData.state,
          city: formData.city || null,
          baseRate: parseFloat(formData.baseRate),
          perKgRate: parseFloat(formData.perKgRate) || 0,
          estimatedDays: parseInt(formData.estimatedDays),
        }),
      });

      if (!response.ok) throw new Error();
      toast.success(editingId ? 'Zone updated' : 'Zone created');
      resetForm();
      fetchZones();
    } catch {
      toast.error('Failed to save zone');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this shipping zone?')) return;

    try {
      const response = await fetch(`${API_URL}/api/shipping/zones/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
      });

      if (!response.ok) throw new Error();
      toast.success('Zone deleted');
      fetchZones();
    } catch {
      toast.error('Failed to delete zone');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', state: '', city: '', baseRate: '', perKgRate: '', estimatedDays: '3' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Zones</h1>
          <p className="text-muted-foreground mt-1">Configure delivery rates by location</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Zone
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-card border border-border rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Zone Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Lagos Mainland"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Lagos"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City (Optional)</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ikeja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Base Rate (₦)</label>
              <input
                type="number"
                value={formData.baseRate}
                onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="2500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Per kg Rate (₦)</label>
              <input
                type="number"
                value={formData.perKgRate}
                onChange={(e) => setFormData({ ...formData, perKgRate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Est. Delivery Days</label>
              <input
                type="number"
                value={formData.estimatedDays}
                onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
              {editingId ? 'Update' : 'Create'} Zone
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
      ) : zones.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No shipping zones configured</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-semibold">Zone</th>
                <th className="text-left px-4 py-3 font-semibold">Location</th>
                <th className="text-left px-4 py-3 font-semibold">Base Rate</th>
                <th className="text-left px-4 py-3 font-semibold">Per kg</th>
                <th className="text-left px-4 py-3 font-semibold">Days</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{zone.name}</td>
                  <td className="px-4 py-3">
                    {zone.state}
                    {zone.city ? `, ${zone.city}` : ''}
                  </td>
                  <td className="px-4 py-3">{formatNaira(zone.baseRate)}</td>
                  <td className="px-4 py-3">{formatNaira(zone.perKgRate)}</td>
                  <td className="px-4 py-3">{zone.estimatedDays}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditingId(zone.id);
                        setFormData({
                          name: zone.name,
                          state: zone.state,
                          city: zone.city || '',
                          baseRate: zone.baseRate,
                          perKgRate: zone.perKgRate,
                          estimatedDays: zone.estimatedDays.toString(),
                        });
                        setShowForm(true);
                      }}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600 inline-block"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
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
