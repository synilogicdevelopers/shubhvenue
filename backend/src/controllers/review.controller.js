import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Venue from '../models/Venue.js';

// Helper function to add timeout to promises
const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { venueId, rating, comment } = req.body;

    // Validation
    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Check if venue exists
    const venueQuery = Venue.findById(venueId).maxTimeMS(5000);
    const venue = await withTimeout(venueQuery, 7000);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Users can review any venue multiple times
    // No restriction on duplicate reviews

    // Create review
    const review = new Review({
      userId,
      venueId,
      rating: Number(rating),
      comment: comment || ''
    });

    const savePromise = review.save();
    await withTimeout(savePromise, 10000);

    // Populate user and venue details
    await review.populate('userId', 'name email');
    await review.populate('venueId', 'name');

    // Update venue rating info
    await updateVenueRating(venueId);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews by venue ID
export const getReviewsByVenue = async (req, res) => {
  try {
    const { venueId } = req.params;

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const reviewsQuery = Review.find({ venueId })
      .populate('userId', 'name email')
      .populate('reply.repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .maxTimeMS(10000);

    const reviews = await withTimeout(reviewsQuery, 12000);

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get reviews by venue error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews by user ID
export const getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;
    const userRole = req.user?.role;

    // Users can only see their own reviews unless they're admin
    if (userRole !== 'admin' && userId !== currentUserId) {
      return res.status(403).json({ error: 'You can only view your own reviews' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const reviewsQuery = Review.find({ userId })
      .populate('venueId', 'name location images')
      .populate('reply.repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .maxTimeMS(10000);

    const reviews = await withTimeout(reviewsQuery, 12000);

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get reviews by user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all reviews (with optional filters)
export const getReviews = async (req, res) => {
  try {
    const { venueId, userId, rating } = req.query;

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    let filter = {};
    if (venueId) filter.venueId = venueId;
    if (userId) filter.userId = userId;
    if (rating) filter.rating = Number(rating);

    const reviewsQuery = Review.find(filter)
      .populate('userId', 'name email')
      .populate('venueId', 'name location')
      .populate('reply.repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .maxTimeMS(10000);

    const reviews = await withTimeout(reviewsQuery, 12000);

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single review by ID
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const reviewQuery = Review.findById(id)
      .populate('userId', 'name email')
      .populate('venueId', 'name location')
      .populate('reply.repliedBy', 'name email')
      .maxTimeMS(10000);

    const review = await withTimeout(reviewQuery, 12000);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Get review by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { rating, comment } = req.body;

    // Validation
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const reviewQuery = Review.findById(id).maxTimeMS(10000);
    const review = await withTimeout(reviewQuery, 12000);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns this review or is admin
    const userRole = req.user?.role;
    if (userRole !== 'admin' && review.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }

    // Update fields
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;

    const savePromise = review.save();
    await withTimeout(savePromise, 10000);

    // Update venue rating info
    await updateVenueRating(review.venueId);

    // Populate user and venue details
    await review.populate('userId', 'name email');
    await review.populate('venueId', 'name');

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const reviewQuery = Review.findById(id).maxTimeMS(10000);
    const review = await withTimeout(reviewQuery, 12000);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns this review or is admin
    const userRole = req.user?.role;
    if (userRole !== 'admin' && review.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    const venueId = review.venueId;

    const deletePromise = Review.findByIdAndDelete(id);
    await withTimeout(deletePromise, 10000);

    // Update venue rating info
    await updateVenueRating(venueId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews for all venues owned by a vendor
export const getReviewsByVendor = async (req, res) => {
  try {
    const vendorId = req.user?.userId;
    const userRole = req.user?.role;

    // Only vendors can access this endpoint
    if (userRole !== 'vendor' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Only vendors can access this endpoint' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Get all venues owned by this vendor
    const venuesQuery = Venue.find({ vendorId }).select('_id name').maxTimeMS(10000);
    const venues = await withTimeout(venuesQuery, 12000);
    
    const venueIds = venues.map(venue => venue._id);

    if (venueIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        reviews: [],
        venues: []
      });
    }

    // Get all reviews for these venues
    const reviewsQuery = Review.find({ venueId: { $in: venueIds } })
      .populate('userId', 'name email')
      .populate('venueId', 'name location images')
      .populate('reply.repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .maxTimeMS(10000);

    const reviews = await withTimeout(reviewsQuery, 12000);

    res.json({
      success: true,
      count: reviews.length,
      reviews,
      venues: venues.map(v => ({ id: v._id, name: v.name }))
    });
  } catch (error) {
    console.error('Get reviews by vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add reply to a review (vendor only)
export const addReplyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const vendorId = req.user?.userId;
    const userRole = req.user?.role;

    // Only vendors and admins can reply
    if (userRole !== 'vendor' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Only vendors can reply to reviews' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Find the review
    const reviewQuery = Review.findById(id).maxTimeMS(10000);
    const review = await withTimeout(reviewQuery, 12000);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if vendor owns the venue
    const venueQuery = Venue.findById(review.venueId).maxTimeMS(5000);
    const venue = await withTimeout(venueQuery, 7000);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if vendor owns this venue (unless admin)
    if (userRole !== 'admin' && venue.vendorId.toString() !== vendorId) {
      return res.status(403).json({ error: 'You can only reply to reviews for your own venues' });
    }

    // Add reply
    review.reply = {
      message: message.trim(),
      repliedBy: vendorId,
      repliedAt: new Date()
    };

    const savePromise = review.save();
    await withTimeout(savePromise, 10000);

    // Populate user and venue details
    await review.populate('userId', 'name email');
    await review.populate('venueId', 'name');
    await review.populate('reply.repliedBy', 'name email');

    res.json({
      success: true,
      message: 'Reply added successfully',
      review
    });
  } catch (error) {
    console.error('Add reply error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update reply to a review (vendor only)
export const updateReplyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const vendorId = req.user?.userId;
    const userRole = req.user?.role;

    // Only vendors and admins can update replies
    if (userRole !== 'vendor' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Only vendors can update replies' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Find the review
    const reviewQuery = Review.findById(id).maxTimeMS(10000);
    const review = await withTimeout(reviewQuery, 12000);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (!review.reply) {
      return res.status(400).json({ error: 'No reply exists to update' });
    }

    // Check if vendor owns the venue
    const venueQuery = Venue.findById(review.venueId).maxTimeMS(5000);
    const venue = await withTimeout(venueQuery, 7000);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if vendor owns this venue (unless admin)
    if (userRole !== 'admin' && venue.vendorId.toString() !== vendorId) {
      return res.status(403).json({ error: 'You can only update replies for your own venues' });
    }

    // Update reply
    review.reply.message = message.trim();
    review.reply.repliedAt = new Date();

    const savePromise = review.save();
    await withTimeout(savePromise, 10000);

    // Populate user and venue details
    await review.populate('userId', 'name email');
    await review.populate('venueId', 'name');
    await review.populate('reply.repliedBy', 'name email');

    res.json({
      success: true,
      message: 'Reply updated successfully',
      review
    });
  } catch (error) {
    console.error('Update reply error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete reply from a review (vendor only)
export const deleteReplyFromReview = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user?.userId;
    const userRole = req.user?.role;

    // Only vendors and admins can delete replies
    if (userRole !== 'vendor' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Only vendors can delete replies' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Find the review
    const reviewQuery = Review.findById(id).maxTimeMS(10000);
    const review = await withTimeout(reviewQuery, 12000);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (!review.reply) {
      return res.status(400).json({ error: 'No reply exists to delete' });
    }

    // Check if vendor owns the venue
    const venueQuery = Venue.findById(review.venueId).maxTimeMS(5000);
    const venue = await withTimeout(venueQuery, 7000);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if vendor owns this venue (unless admin)
    if (userRole !== 'admin' && venue.vendorId.toString() !== vendorId) {
      return res.status(403).json({ error: 'You can only delete replies for your own venues' });
    }

    // Delete reply
    review.reply = undefined;

    const savePromise = review.save();
    await withTimeout(savePromise, 10000);

    // Populate user and venue details
    await review.populate('userId', 'name email');
    await review.populate('venueId', 'name');

    res.json({
      success: true,
      message: 'Reply deleted successfully',
      review
    });
  } catch (error) {
    console.error('Delete reply error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to update venue rating info
const updateVenueRating = async (venueId) => {
  try {
    const reviewsQuery = Review.find({ venueId }).maxTimeMS(10000);
    const reviews = await withTimeout(reviewsQuery, 12000);

    if (reviews.length === 0) {
      // No reviews, set default values
      await Venue.findByIdAndUpdate(venueId, {
        $set: {
          'ratingInfo.average': 0,
          'ratingInfo.totalReviews': 0,
          'ratingInfo.reviews': []
        }
      });
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Format reviews for venue
    const formattedReviews = await Promise.all(
      reviews.map(async (review) => {
        await review.populate('userId', 'name');
        return {
          user: review.userId?.name || 'Anonymous',
          rating: review.rating,
          comment: review.comment || '',
          date: review.createdAt.toISOString().split('T')[0]
        };
      })
    );

    // Update venue
    await Venue.findByIdAndUpdate(venueId, {
      $set: {
        'ratingInfo.average': Math.round(averageRating * 10) / 10, // Round to 1 decimal
        'ratingInfo.totalReviews': reviews.length,
        'ratingInfo.reviews': formattedReviews
      }
    });
  } catch (error) {
    console.error('Update venue rating error:', error);
    // Don't throw error, just log it
  }
};

