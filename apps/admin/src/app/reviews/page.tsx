'use client';

import React, { useState, useEffect } from 'react';
import { Loader, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Review {
  id: number;
  productId: number;
  customerName: string;
  rating: number;
  title: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const endpoint = filter === 'pending' ? '/api/reviews/pending' : '/api/reviews';
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
      });

      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      
      if (filter === 'pending') {
        setReviews(data.filter((r: Review) => !r.isApproved));
      } else {
        setReviews(data.filter((r: Review) => r.isApproved));
      }
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
      });

      if (!response.ok) throw new Error();
      toast.success('Review approved');
      fetchReviews();
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return;

    try {
      const response = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin-token')}` },
      });

      if (!response.ok) throw new Error();
      toast.success('Review deleted');
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Management</h1>
        <p className="text-muted-foreground mt-1">Moderate customer reviews</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-muted'
          }`}
        >
          Pending ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-muted'
          }`}
        >
          Approved
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No {filter} reviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-card border border-border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{review.title}</h3>
                    <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">By {review.customerName} • Product #{review.productId}</p>
                </div>
              </div>

              <p className="text-sm">{review.content}</p>
              <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>

              <div className="flex gap-2 pt-2">
                {!review.isApproved && (
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleDelete(review.id)}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
