import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { reviews, products } from '../db/schema.js';

const reviewsRouter = new Hono();

// POST /api/reviews - Create a new review
reviewsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { productId, customerId, customerName, customerEmail, rating, title, content } = body;

    // Validation
    if (!productId || !customerName || !rating || !title || !content) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }

    if (title.length < 3 || content.length < 10) {
      return c.json({ error: 'Title and content must meet minimum length requirements' }, 400);
    }

    // Create review
    const newReview = await db
      .insert(reviews)
      .values({
        productId,
        customerId: customerId || null,
        customerName,
        customerEmail,
        rating,
        title,
        content,
        verifiedPurchase: customerId ? true : false,
        isApproved: false, // Default to not approved, admin can moderate
      })
      .returning();

    return c.json({ success: true, review: newReview[0] }, 201);
  } catch (error: any) {
    console.error('Error creating review:', error);
    return c.json({ error: error.message || 'Failed to create review' }, 500);
  }
});

// GET /api/reviews/product/:productId - Get all approved reviews for a product
reviewsRouter.get('/product/:productId', async (c) => {
  try {
    const productId = parseInt(c.req.param('productId'));
    const page = parseInt(c.req.query('page') || '1');
    const limit = 10;
    const offset = (page - 1) * limit;

    const productReviews = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          eq(reviews.isApproved, true)
        )
      )
      .orderBy(reviews.createdAt)
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          eq(reviews.isApproved, true)
        )
      );

    return c.json({
      reviews: productReviews,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return c.json({ error: error.message || 'Failed to fetch reviews' }, 500);
  }
});

// GET /api/reviews/product/:productId/stats - Get review statistics for a product
reviewsRouter.get('/product/:productId/stats', async (c) => {
  try {
    const productId = parseInt(c.req.param('productId'));

    const productReviews = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          eq(reviews.isApproved, true)
        )
      );

    const totalReviews = productReviews.length;
    const averageRating =
      totalReviews > 0
        ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2)
        : 0;

    // Count reviews by rating
    const ratingBreakdown = {
      5: productReviews.filter(r => r.rating === 5).length,
      4: productReviews.filter(r => r.rating === 4).length,
      3: productReviews.filter(r => r.rating === 3).length,
      2: productReviews.filter(r => r.rating === 2).length,
      1: productReviews.filter(r => r.rating === 1).length,
    };

    // Update product with rating stats
    if (totalReviews > 0) {
      await db
        .update(products)
        .set({
          reviewCount: totalReviews,
          averageRating: parseFloat(averageRating as any),
        })
        .where(eq(products.id, productId));
    }

    return c.json({
      totalReviews,
      averageRating: parseFloat(averageRating as any),
      ratingBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching review stats:', error);
    return c.json({ error: error.message || 'Failed to fetch review statistics' }, 500);
  }
});

// GET /api/reviews/pending - Get pending reviews for admin moderation
reviewsRouter.get('/pending', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const pendingReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.isApproved, false))
      .orderBy(reviews.createdAt);

    return c.json(pendingReviews);
  } catch (error: any) {
    console.error('Error fetching pending reviews:', error);
    return c.json({ error: error.message || 'Failed to fetch pending reviews' }, 500);
  }
});

// PUT /api/reviews/:id/approve - Approve a review (admin only)
reviewsRouter.put('/:id/approve', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reviewId = parseInt(c.req.param('id'));

    const updated = await db
      .update(reviews)
      .set({ isApproved: true })
      .where(eq(reviews.id, reviewId))
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Recalculate product rating
    const productId = updated[0].productId;
    const productReviews = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          eq(reviews.isApproved, true)
        )
      );

    const averageRating =
      productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        : 0;

    await db
      .update(products)
      .set({
        reviewCount: productReviews.length,
        averageRating,
      })
      .where(eq(products.id, productId));

    return c.json({ success: true, review: updated[0] });
  } catch (error: any) {
    console.error('Error approving review:', error);
    return c.json({ error: error.message || 'Failed to approve review' }, 500);
  }
});

// DELETE /api/reviews/:id - Delete a review (admin only)
reviewsRouter.delete('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reviewId = parseInt(c.req.param('id'));

    const deleted = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (deleted.length === 0) {
      return c.json({ error: 'Review not found' }, 404);
    }

    await db.delete(reviews).where(eq(reviews.id, reviewId));

    // Recalculate product rating
    const productId = deleted[0].productId;
    const productReviews = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          eq(reviews.isApproved, true)
        )
      );

    const averageRating =
      productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        : 0;

    await db
      .update(products)
      .set({
        reviewCount: productReviews.length,
        averageRating,
      })
      .where(eq(products.id, productId));

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return c.json({ error: error.message || 'Failed to delete review' }, 500);
  }
});

export default reviewsRouter;
