'use client';

import React, { useState, useEffect } from 'react';
import { Star, Send, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Review {
  id: number;
  customerName: string;
  rating: number;
  title: string;
  content: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewsProps {
  productId: number;
  customerName?: string;
  onReviewAdded?: () => void;
}

export function ProductReviews({ productId, customerName, onReviewAdded }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: customerName || '',
    rating: 5,
    title: '',
    content: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Fetch reviews and stats
  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productId, page]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/reviews/product/${productId}?page=${page}`
      );

      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data.reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/reviews/product/${productId}/stats`
      );

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (formData.title.trim().length < 3) {
      toast.error('Review title must be at least 3 characters');
      return;
    }

    if (formData.content.trim().length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    try {
      setIsLoadingForm(true);

      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: formData.customerName,
          rating: formData.rating,
          title: formData.title,
          content: formData.content,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      toast.success('Review submitted! It will appear after admin approval.');
      setFormData({
        customerName: customerName || '',
        rating: 5,
        title: '',
        content: '',
      });
      setShowForm(false);
      fetchReviews();
      fetchStats();
      onReviewAdded?.();
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setIsLoadingForm(false);
    }
  };

  const StarRating = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 py-8 border-t border-border/50">
      <h2 className="text-3xl font-bold">Customer Reviews</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Review Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold">{stats.averageRating.toFixed(1)}</span>
              <div className="space-y-2">
                <StarRating rating={Math.round(stats.averageRating)} size="lg" />
                <p className="text-sm text-muted-foreground">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown];
              const percentage =
                stats.totalReviews > 0
                  ? Math.round((count / stats.totalReviews) * 100)
                  : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12 text-right">{rating} star</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Write a Review
        </button>
      )}

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="space-y-4 p-6 bg-muted/30 rounded-lg border border-border"
        >
          <h3 className="text-lg font-bold">Share Your Review</h3>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your name"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating })}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      rating <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Review Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Summarize your experience"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.title.length}/100
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Review</label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none"
              placeholder="Share your experience with this product..."
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.content.length}/1000
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoadingForm}
              className="flex-1 px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingForm && <Loader className="h-4 w-4 animate-spin" />}
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Your review will be displayed after admin approval.
          </p>
        </form>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8">
          <Loader className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-card border border-border rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{review.title}</p>
                  <p className="text-sm text-muted-foreground">
                    By {review.customerName}
                    {review.verifiedPurchase && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </p>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>
              <p className="text-sm">{review.content}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductReviews;
