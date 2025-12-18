import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Venue from '../models/Venue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete image file
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  
  try {
    // Remove /uploads/venues/ prefix to get filename
    const filename = imagePath.replace('/uploads/venues/', '');
    if (filename && !filename.includes('http')) {
      // Only delete local files, not URLs
      const filePath = path.join(__dirname, '../../uploads/venues', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old image: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting image file ${imagePath}:`, error.message);
    // Don't throw error, just log it
  }
};

// Helper function to delete multiple gallery images
const deleteGalleryFiles = (galleryPaths) => {
  if (!Array.isArray(galleryPaths)) return;
  galleryPaths.forEach(path => deleteImageFile(path));
};

// Helper: normalize venue.gallery into an array of photo paths (legacy compat)
const normalizeGalleryPhotos = (gallery) => {
  if (!gallery) return [];
  if (Array.isArray(gallery)) return gallery;
  if (typeof gallery === 'object' && Array.isArray(gallery.photos)) return gallery.photos;
  return [];
};

// Helper function to validate image URL
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Check if it's http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Check for common image extensions in URL
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    const hasImageExtension = imageExtensions.test(urlObj.pathname);
    
    // Also accept URLs that might not have extension but are from known image hosts
    const imageHosts = /(imgur|unsplash|pexels|pixabay|cloudinary|s3|amazonaws|googleusercontent|fbcdn|cdn)/i;
    const isImageHost = imageHosts.test(urlObj.hostname);
    
    return hasImageExtension || isImageHost;
  } catch (error) {
    // Invalid URL format
    return false;
  }
};

// Helper function to validate and process image URLs
const validateAndProcessImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a local path, return as is
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }
  
  // If it's a valid URL, return it
  if (isValidImageUrl(imageUrl)) {
    return imageUrl;
  }
  
  // If it's not a valid URL, return null
  return null;
};

// Helper function to process gallery URLs
const validateAndProcessGalleryUrls = (gallery) => {
  if (!Array.isArray(gallery)) return [];
  
  return gallery
    .filter(url => url) // Remove empty/null values
    .map(url => {
      // Local paths
      if (url.startsWith('/uploads/')) {
        return url;
      }
      // Network URLs
      if (isValidImageUrl(url)) {
        return url;
      }
      return null;
    })
    .filter(url => url !== null); // Remove invalid URLs
};

// Helper function to add timeout to promises
const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

// Helper function to calculate distance between two coordinates using Haversine formula
// Returns distance in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Helper function to format venue response according to new structure
const formatVenueResponse = async (venue) => {
  const venueObj = venue.toObject ? venue.toObject() : venue;
  
  // Handle capacity - can be number (legacy) or object
  let capacityObj = {
    minGuests: 0,
    maxGuests: 0
  };
  if (typeof venueObj.capacity === 'number' && venueObj.capacity > 0) {
    capacityObj = {
      minGuests: 1,
      maxGuests: venueObj.capacity
    };
  } else if (venueObj.capacity && typeof venueObj.capacity === 'object') {
    capacityObj = {
      minGuests: venueObj.capacity.minGuests || venueObj.capacity.min || 0,
      maxGuests: venueObj.capacity.maxGuests || venueObj.capacity.max || venueObj.capacity || 0
    };
  }

  // Handle location - ensure it has all required fields
  let locationObj = {};
  if (!venueObj.location) {
    // No location provided
    locationObj = {
      address: '',
      city: '',
      state: '',
      pincode: '',
      latitude: null,
      longitude: null,
      mapLink: ''
    };
  } else if (typeof venueObj.location === 'string') {
    // Location is a string
    locationObj = {
      address: venueObj.location,
      city: '',
      state: '',
      pincode: '',
      latitude: null,
      longitude: null,
      mapLink: ''
    };
  } else if (venueObj.location && typeof venueObj.location === 'object' && venueObj.location.constructor === Object) {
    // Location is a plain object (not array, not null, not Date, etc.)
    locationObj = {
      address: venueObj.location.address || venueObj.location.Address || '',
      city: venueObj.location.city || venueObj.location.City || '',
      state: venueObj.location.state || venueObj.location.State || '',
      pincode: venueObj.location.pincode || venueObj.location.pincode || venueObj.location.Pincode || '',
      latitude: venueObj.location.latitude || venueObj.location.Latitude || null,
      longitude: venueObj.location.longitude || venueObj.location.Longitude || null,
      mapLink: venueObj.location.mapLink || venueObj.location.MapLink || venueObj.location.mapLink || ''
    };
  } else {
    // Fallback: try to convert to string or use empty object
    locationObj = {
      address: String(venueObj.location) || '',
      city: '',
      state: '',
      pincode: '',
      latitude: null,
      longitude: null,
      mapLink: ''
    };
  }

  // Handle pricingInfo
  const pricingInfo = venueObj.pricingInfo || {};
  if (!pricingInfo.vegPerPlate && venueObj.pricePerPlate?.veg) {
    pricingInfo.vegPerPlate = venueObj.pricePerPlate.veg;
  }
  if (!pricingInfo.nonVegPerPlate && venueObj.pricePerPlate?.nonVeg) {
    pricingInfo.nonVegPerPlate = venueObj.pricePerPlate.nonVeg;
  }
  if (!pricingInfo.rentalPrice && venueObj.price) {
    pricingInfo.rentalPrice = venueObj.price;
  }

  // Handle availability
  const availability = venueObj.availability || {};
  if (!availability.status) {
    availability.status = 'Open';
  }

  // Handle bookingInfo
  const bookingInfo = venueObj.bookingInfo || {};
  if (!bookingInfo.advanceRequired && venueObj.bookingPolicy?.advancePercentage) {
    bookingInfo.advanceRequired = `${venueObj.bookingPolicy.advancePercentage}%`;
  }
  if (!bookingInfo.cancellationPolicy && venueObj.bookingPolicy?.cancellationPolicy) {
    bookingInfo.cancellationPolicy = venueObj.bookingPolicy.cancellationPolicy;
  }
  if (!bookingInfo.bookingContact && venueObj.contact) {
    bookingInfo.bookingContact = venueObj.contact;
  }

  // Fetch reviews from Review model to get reply data
  let reviewsWithReplies = [];
  let reviewCount = 0;
  let avgRating = 0;
  
  try {
    const Review = (await import('../models/Review.js')).default;
    const venueReviews = await Review.find({ venueId: venueObj._id })
      .populate('userId', 'name email')
      .populate('reply.repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .maxTimeMS(10000);
    
    if (Array.isArray(venueReviews) && venueReviews.length > 0) {
      reviewsWithReplies = venueReviews.map(review => {
        const reviewObj = review.toObject ? review.toObject() : review;
        
        // Check if reply exists and has message
        let replyData = null;
        if (reviewObj.reply && reviewObj.reply.message && typeof reviewObj.reply.message === 'string' && reviewObj.reply.message.trim()) {
          replyData = {
            message: reviewObj.reply.message.trim(),
            repliedBy: (reviewObj.reply.repliedBy && typeof reviewObj.reply.repliedBy === 'object' && reviewObj.reply.repliedBy.name) 
              ? reviewObj.reply.repliedBy.name 
              : (typeof reviewObj.reply.repliedBy === 'string' ? reviewObj.reply.repliedBy : 'Venue Owner'),
            repliedAt: reviewObj.reply.repliedAt 
              ? (reviewObj.reply.repliedAt instanceof Date ? reviewObj.reply.repliedAt.toISOString() : reviewObj.reply.repliedAt) 
              : null
          };
        }
        
        return {
          _id: reviewObj._id,
          user: (reviewObj.userId && typeof reviewObj.userId === 'object' && reviewObj.userId.name) 
            ? reviewObj.userId.name 
            : (typeof reviewObj.userId === 'string' ? reviewObj.userId : 'Anonymous'),
          userId: (reviewObj.userId && typeof reviewObj.userId === 'object' && reviewObj.userId._id) 
            ? reviewObj.userId._id 
            : reviewObj.userId,
          rating: reviewObj.rating || 0,
          comment: reviewObj.comment || '',
          date: reviewObj.createdAt ? (reviewObj.createdAt instanceof Date ? reviewObj.createdAt.toISOString() : reviewObj.createdAt) : new Date().toISOString(),
          reply: replyData
        };
      });
      
      reviewCount = venueReviews.length;
      const totalRating = venueReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      avgRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
    }
  } catch (reviewError) {
    console.error('Error fetching reviews for venue:', reviewError);
    // Fallback to embedded reviews if Review model fetch fails
    reviewsWithReplies = venueObj.ratingInfo?.reviews || [];
    reviewCount = reviewsWithReplies.length;
  }

  // Handle rating
  const rating = venueObj.ratingInfo || {};
  if (!rating.average && avgRating > 0) {
    rating.average = avgRating;
  } else if (!rating.average && venueObj.rating) {
    rating.average = venueObj.rating;
  }
  if (!rating.totalReviews && reviewCount > 0) {
    rating.totalReviews = reviewCount;
  } else if (!rating.totalReviews && rating.reviews) {
    rating.totalReviews = rating.reviews.length;
  }

  // Handle gallery
  let galleryObj = {};
  if (venueObj.galleryInfo) {
    galleryObj = {
      photos: venueObj.galleryInfo.photos || [],
      videos: venueObj.galleryInfo.videos || []
    };
  } else if (Array.isArray(venueObj.gallery)) {
    galleryObj = {
      photos: venueObj.gallery,
      videos: venueObj.videos || []
    };
  } else if (venueObj.gallery && typeof venueObj.gallery === 'object') {
    galleryObj = venueObj.gallery;
  } else {
    galleryObj = {
      photos: venueObj.images || [],
      videos: venueObj.videos || []
    };
  }

  // Build response
  return {
    _id: venueObj._id,
    name: venueObj.name,
    slug: venueObj.slug,
    price: venueObj.price || pricingInfo.rentalPrice || 0, // Include price for backward compatibility
    coverImage: venueObj.coverImage || venueObj.image || (venueObj.images && venueObj.images[0]) || '',
    images: venueObj.images || (Array.isArray(venueObj.gallery) ? venueObj.gallery : []),
    location: locationObj,
    pricingInfo: {
      vegPerPlate: pricingInfo.vegPerPlate || 0,
      nonVegPerPlate: pricingInfo.nonVegPerPlate || 0,
      rentalPrice: pricingInfo.rentalPrice || venueObj.price || 0,
      taxIncluded: pricingInfo.taxIncluded || false,
      decorationCost: pricingInfo.decorationCost || '',
      djCost: pricingInfo.djCost || ''
    },
    capacity: capacityObj,
    availability: {
      status: availability.status || 'Open',
      availableDates: availability.availableDates || [],
      openDays: availability.openDays || [],
      openTime: availability.openTime || '',
      closeTime: availability.closeTime || ''
    },
    bookingInfo: {
      advanceRequired: bookingInfo.advanceRequired || '',
      cancellationPolicy: bookingInfo.cancellationPolicy || '',
      bookingContact: bookingInfo.bookingContact || venueObj.contact || {}
    },
    about: venueObj.about || venueObj.description || '',
    amenities: [...(venueObj.amenities || []), ...(venueObj.facilities || [])], // Merge facilities into amenities
    highlights: venueObj.highlights || [],
    rooms: venueObj.rooms || 0,
    rating: {
      average: rating.average || venueObj.rating || 0,
      totalReviews: rating.totalReviews || 0,
      reviews: reviewsWithReplies.length > 0 ? reviewsWithReplies : (rating.reviews || [])
    },
    gallery: galleryObj,
    vendorId: venueObj.vendorId,
    categoryId: venueObj.categoryId,
    category: venueObj.categoryId && typeof venueObj.categoryId === 'object' ? {
      _id: venueObj.categoryId._id,
      name: venueObj.categoryId.name,
      description: venueObj.categoryId.description,
      icon: venueObj.categoryId.icon,
      image: venueObj.categoryId.image
    } : null,
    menuId: venueObj.menuId,
    subMenuId: venueObj.subMenuId,
    status: venueObj.status,
    vendorActive: venueObj.vendorActive !== undefined ? venueObj.vendorActive : true,
    bookingButtonEnabled: venueObj.bookingButtonEnabled !== undefined ? venueObj.bookingButtonEnabled : true,
    leadsButtonEnabled: venueObj.leadsButtonEnabled !== undefined ? venueObj.leadsButtonEnabled : true,
    createdAt: venueObj.createdAt,
    updatedAt: venueObj.updatedAt
  };
};

// Get venues - role-aware
  // For vendors: returns their own venues
  // For customers/others: returns all approved & vendorActive venues
export const getVenues = async (req, res) => {
  try {
    // Check MongoDB connection with timeout
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 8000); // 8 second timeout for connection
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const userId = req.user?.userId; // Optional - can be null for public access
    const userRole = req.user?.role; // Optional - can be null for public access

    let filter = {};

    // If user is a vendor, show only their venues
    if (userRole === 'vendor' && userId) {
      filter.vendorId = userId;
    } else {
      // Public/customers: only show admin-approved/active and vendorActive not false (treat undefined as true)
      filter.status = { $in: ['approved', 'active'] };
      filter.vendorActive = { $ne: false };
    }

    // Optional query parameters
    const { 
      location, 
      city,
      state,
      latitude, // Customer's latitude for nearby search
      longitude, // Customer's longitude for nearby search
      radius, // Search radius in kilometers (default: 50km)
      minPrice, 
      maxPrice,
      minPricePerPlateVeg,
      maxPricePerPlateVeg,
      minPricePerPlateNonVeg,
      maxPricePerPlateNonVeg,
      minCapacity, 
      maxCapacity,
      status,
      venueType,
      categoryId,
      menuId,
      subMenuId,
      tags,
      isFeatured,
      minRating,
      search // General search in name, description
    } = req.query;

    // Location filtering - support both string and object location
    if (location) {
      // If location is a string, search in both string location and location.address
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { 'location.address': { $regex: location, $options: 'i' } }
      ];
    }

    // City filtering
    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' };
    }

    // State filtering
    if (state) {
      filter['location.state'] = { $regex: state, $options: 'i' };
    }

    // Price filtering (legacy price field)
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Price per plate filtering (veg)
    if (minPricePerPlateVeg || maxPricePerPlateVeg) {
      filter['pricePerPlate.veg'] = {};
      if (minPricePerPlateVeg) filter['pricePerPlate.veg'].$gte = Number(minPricePerPlateVeg);
      if (maxPricePerPlateVeg) filter['pricePerPlate.veg'].$lte = Number(maxPricePerPlateVeg);
    }

    // Price per plate filtering (non-veg)
    if (minPricePerPlateNonVeg || maxPricePerPlateNonVeg) {
      filter['pricePerPlate.nonVeg'] = {};
      if (minPricePerPlateNonVeg) filter['pricePerPlate.nonVeg'].$gte = Number(minPricePerPlateNonVeg);
      if (maxPricePerPlateNonVeg) filter['pricePerPlate.nonVeg'].$lte = Number(maxPricePerPlateNonVeg);
    }

    // Capacity filtering
    if (minCapacity) {
      filter.capacity = { $gte: Number(minCapacity) };
    }
    if (maxCapacity) {
      if (!filter.capacity) filter.capacity = {};
      filter.capacity.$lte = Number(maxCapacity);
    }

    // Status filtering
    if (status) {
      if (userRole === 'vendor') {
        // Vendors can filter by any status for their own venues
        filter.status = status;
      } else {
        // For public access, only allow approved/active status
        if (status === 'approved' || status === 'active') {
          filter.status = status;
        } else {
          // If invalid status requested, default to approved/active
          filter.status = { $in: ['approved', 'active'] };
        }
      }
    }

    // Venue type filtering
    if (venueType) {
      filter.venueType = { $regex: venueType, $options: 'i' };
    }

    // Category filtering
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Menu filtering
    if (subMenuId) {
      // If subMenuId is provided, filter by subMenuId
      filter.subMenuId = subMenuId;
    } else if (menuId) {
      // If only menuId is provided, filter by menuId (venues directly assigned to menu, not submenu)
      filter.menuId = menuId;
      filter.subMenuId = null; // Only venues directly assigned to menu, not submenus
    }

    // Tags filtering
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Featured filtering
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    // Rating filtering
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // General search in name, description, slug
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchFilter = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { slug: searchRegex }
        ]
      };
      // Merge with existing $or if location filter exists
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          searchFilter
        ];
        delete filter.$or;
      } else {
        Object.assign(filter, searchFilter);
      }
    }

    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Sorting
    let sort = { createdAt: -1 }; // Default: newest first
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }

    // Execute query with pagination and timeout
    const queryPromise = Venue.find(filter)
      .populate('vendorId', 'name email phone')
      .populate('categoryId', 'name description icon image')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .maxTimeMS(10000); // 10 second query timeout

    const countPromise = Venue.countDocuments(filter).maxTimeMS(10000);

    const [venues, initialTotalCount] = await Promise.all([
      withTimeout(queryPromise, 15000),
      withTimeout(countPromise, 15000)
    ]);

    // Get review counts for all venues (only if venues exist)
    let reviewCountMap = {};
    if (venues && venues.length > 0) {
      try {
        const Review = (await import('../models/Review.js')).default;
        // Venues from Mongoose query already have ObjectId _id fields
        const venueIds = venues.map(v => v._id).filter(id => id != null);
        
        if (venueIds.length > 0) {
          const reviewCountsQuery = Review.aggregate([
            { $match: { venueId: { $in: venueIds } } },
            { $group: { _id: '$venueId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
          ]).maxTimeMS(10000);
          
          const reviewCounts = await withTimeout(reviewCountsQuery, 12000);
          if (Array.isArray(reviewCounts)) {
            reviewCounts.forEach(rc => {
              if (rc && rc._id) {
                const venueId = rc._id.toString ? rc._id.toString() : String(rc._id);
                reviewCountMap[venueId] = {
                  count: rc.count || 0,
                  avgRating: rc.avgRating ? Math.round(rc.avgRating * 10) / 10 : 0
                };
              }
            });
          }
        }
      } catch (reviewError) {
        console.error('Error fetching review counts:', reviewError);
        // Continue without review counts if there's an error - don't break the API
        reviewCountMap = {};
      }
    }

    // Format venues according to new structure
    let formattedVenues = await Promise.all(venues.map(async (venue) => {
      const formatted = await formatVenueResponse(venue);
      const venueIdStr = venue._id.toString();
      const reviewInfo = reviewCountMap[venueIdStr];
      
      // Update rating info with actual review counts (but keep reviews with replies from formatVenueResponse)
      if (reviewInfo) {
        formatted.rating = {
          average: reviewInfo.avgRating || formatted.rating?.average || 0,
          totalReviews: reviewInfo.count || formatted.rating?.totalReviews || 0,
          reviews: formatted.rating?.reviews || [] // Keep reviews with replies from formatVenueResponse
        };
        formatted.reviewCount = reviewInfo.count;
      } else {
        // Use existing rating info from venue
        formatted.reviewCount = formatted.rating?.totalReviews || 0;
        if (!formatted.rating) {
          formatted.rating = {
            average: 0,
            totalReviews: 0,
            reviews: []
          };
        }
      }
      
      return formatted;
    }));
    let totalCount = initialTotalCount; // Use let so it can be reassigned

    // Location-based filtering and sorting (if customer location provided)
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      const searchRadius = parseFloat(radius) || 50; // Default 50km radius

      if (!isNaN(userLat) && !isNaN(userLon) && !isNaN(searchRadius)) {
        // Calculate distance for each venue and filter by radius
        const venuesWithDistance = formattedVenues
          .map(venue => {
            // Get venue coordinates
            let venueLat = null;
            let venueLon = null;

            if (venue.location && typeof venue.location === 'object') {
              venueLat = venue.location.latitude;
              venueLon = venue.location.longitude;
            }

            // Calculate distance if venue has coordinates
            let distance = null;
            if (venueLat !== null && venueLon !== null && 
                !isNaN(venueLat) && !isNaN(venueLon)) {
              distance = calculateDistance(userLat, userLon, venueLat, venueLon);
            }

            return {
              ...venue,
              distance: distance, // Distance in kilometers
              hasCoordinates: venueLat !== null && venueLon !== null
            };
          })
          .filter(venue => {
            // Filter venues within radius (or venues without coordinates if no radius filter)
            if (venue.distance === null) {
              // Include venues without coordinates if they're within other filters
              return true;
            }
            return venue.distance <= searchRadius;
          })
          .sort((a, b) => {
            // Sort by distance (nearest first)
            // Venues with coordinates come first, sorted by distance
            // Venues without coordinates come last
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });

        formattedVenues = venuesWithDistance;
        
        // Update totalCount to reflect filtered results
        totalCount = formattedVenues.length;
      }
    }

    res.json({
      success: true,
      count: formattedVenues.length,
      totalCount: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      data: formattedVenues
    });
  } catch (error) {
    console.error('Get venues error:', error);
    
    // Handle timeout errors specifically
    if (error.message && error.message.includes('timed out')) {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'The database query took too long. Please try again or contact support.'
      });
    }
    
    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        error: 'Database error',
        hint: 'Unable to connect to database. Please try again later.'
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single venue by ID (public - no auth required)
export const getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId; // Optional - can be null for public access
    const userRole = req.user?.role; // Optional - can be null for public access

    // Check MongoDB connection with timeout
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000); // 5 second timeout for connection
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const venueQuery = Venue.findById(id)
      .populate('vendorId', 'name email phone')
      .populate('categoryId', 'name description icon image')
      .maxTimeMS(10000); // 10 second query timeout

    const venue = await withTimeout(venueQuery, 12000);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // If user is vendor, they can see their own venues regardless of status
    // Otherwise (public/non-vendor), only show approved/active AND vendorActive=true
    const isOwnerVendor = userId && userRole === 'vendor' && venue.vendorId._id.toString() === userId;
    if (!isOwnerVendor) {
      const isApproved = venue.status === 'approved' || venue.status === 'active';
      const isVendorActive = venue.vendorActive !== false; // default true if undefined
      if (!isApproved || !isVendorActive) {
        return res.status(403).json({ error: 'Venue not available' });
      }
    }

    // Format response according to new structure
    const formattedVenue = await formatVenueResponse(venue);

    res.json({
      success: true,
      data: formattedVenue
    });
  } catch (error) {
    console.error('Get venue by ID error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create venue (vendor only)
export const createVenue = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can create venues' });
    }

    const { 
      name, 
      slug,
      description,
      about,
      price, // Legacy field
      pricePerPlate,
      pricingInfo,
      venueType,
      categoryId,
      menuId,
      subMenuId,
      location, 
      capacity, 
      facilities,
      amenities,
      highlights,
      rooms,
      images,
      coverImage,
      videos,
      contact,
      availability,
      bookingPolicy,
      bookingInfo,
      tags,
      rating,
      ratingInfo,
      gallery,
      galleryInfo,
      isFeatured,
      status
    } = req.body;

    // Validation - name and capacity are required
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate capacity - can be number or object
    let capacityValue = capacity;
    if (typeof capacity === 'object' && capacity !== null) {
      if (!capacity.minGuests && !capacity.maxGuests) {
        return res.status(400).json({ error: 'Capacity must have minGuests or maxGuests' });
      }
      if (capacity.minGuests && capacity.minGuests <= 0) {
        return res.status(400).json({ error: 'minGuests must be greater than 0' });
      }
      if (capacity.maxGuests && capacity.maxGuests <= 0) {
        return res.status(400).json({ error: 'maxGuests must be greater than 0' });
      }
      if (capacity.minGuests && capacity.maxGuests && capacity.minGuests > capacity.maxGuests) {
        return res.status(400).json({ error: 'minGuests cannot be greater than maxGuests' });
      }
    } else if (capacity !== undefined && capacity !== null) {
      if (Number(capacity) <= 0) {
        return res.status(400).json({ error: 'Capacity must be greater than 0' });
      }
      capacityValue = Number(capacity);
    } else {
      return res.status(400).json({ error: 'Capacity is required' });
    }

    // Validate pricePerPlate if provided
    if (pricePerPlate) {
      if (pricePerPlate.veg && pricePerPlate.veg <= 0) {
        return res.status(400).json({ error: 'Veg price per plate must be greater than 0' });
      }
      if (pricePerPlate.nonVeg && pricePerPlate.nonVeg <= 0) {
        return res.status(400).json({ error: 'Non-veg price per plate must be greater than 0' });
      }
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Validate categoryId if provided
    if (categoryId) {
      const Category = (await import('../models/Category.js')).default;
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
      if (!category.isActive) {
        return res.status(400).json({ error: 'Category is not active' });
      }
    }

    // Normalize menuId and subMenuId - handle empty strings
    if (menuId === '' || menuId === null || menuId === undefined) {
      menuId = null;
    }
    if (subMenuId === '' || subMenuId === null || subMenuId === undefined) {
      subMenuId = null;
    }

    // Validate menuId if provided
    if (menuId) {
      const Menu = (await import('../models/Menu.js')).default;
      const menu = await Menu.findById(menuId);
      if (!menu) {
        return res.status(400).json({ error: 'Invalid menu ID' });
      }
      if (!menu.isActive) {
        return res.status(400).json({ error: 'Menu is not active' });
      }
      // Ensure it's a main menu (not a submenu)
      if (menu.parentMenuId) {
        return res.status(400).json({ error: 'menuId must be a main menu, not a submenu. Use subMenuId for submenus.' });
      }
      console.log('✅ Valid menuId:', menuId, 'Menu name:', menu.name);
    }

    // Validate subMenuId if provided
    if (subMenuId) {
      const Menu = (await import('../models/Menu.js')).default;
      const submenu = await Menu.findById(subMenuId);
      if (!submenu) {
        return res.status(400).json({ error: 'Invalid submenu ID' });
      }
      if (!submenu.isActive) {
        return res.status(400).json({ error: 'Submenu is not active' });
      }
      // Ensure it's a submenu (has parentMenuId)
      if (!submenu.parentMenuId) {
        return res.status(400).json({ error: 'subMenuId must be a submenu. Use menuId for main menus.' });
      }
      // If subMenuId is provided, menuId should match the parent
      if (menuId && submenu.parentMenuId.toString() !== menuId) {
        return res.status(400).json({ error: 'subMenuId must belong to the specified menuId' });
      }
      // If menuId is not provided but subMenuId is, set menuId to parent
      if (!menuId) {
        menuId = submenu.parentMenuId;
        console.log('ℹ️ Auto-set menuId from subMenuId parent:', menuId);
      }
      console.log('✅ Valid subMenuId:', subMenuId, 'Submenu name:', submenu.name);
    }

    // Handle image uploads
    let imagePath = null;
    let galleryPaths = [];
    let imageUrls = [];

    // Handle cover image - priority: file upload > body URL
    let coverImagePath = null;
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      coverImagePath = `/uploads/venues/${req.files.coverImage[0].filename}`;
    } else if (coverImage) {
      coverImagePath = validateAndProcessImageUrl(coverImage);
      if (coverImage && !coverImagePath) {
        return res.status(400).json({ 
          error: 'Invalid cover image URL. Please provide a valid image URL (http/https) or upload a file.' 
        });
      }
    }

    // Handle main image - priority: file upload > body URL (legacy support)
    if (req.files && req.files.image && req.files.image[0]) {
      imagePath = `/uploads/venues/${req.files.image[0].filename}`;
    } else if (req.body.image) {
      // Validate and process network image URL
      imagePath = validateAndProcessImageUrl(req.body.image);
      if (req.body.image && !imagePath) {
        return res.status(400).json({ 
          error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
        });
      }
    }
    
    // Use coverImage if imagePath is not set
    if (!imagePath && coverImagePath) {
      imagePath = coverImagePath;
    }

    // Handle gallery images - file uploads
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      galleryPaths = req.files.gallery.map(file => `/uploads/venues/${file.filename}`);
    }

    // Handle gallery images - network URLs from body
    const galleryFromBody = req.body.gallery;
    if (galleryFromBody) {
      if (Array.isArray(galleryFromBody)) {
        // Validate and process network image URLs
        const validatedUrls = validateAndProcessGalleryUrls(galleryFromBody);
        galleryPaths = [...galleryPaths, ...validatedUrls];
      } else if (typeof galleryFromBody === 'string') {
        // Single URL as string
        const validatedUrl = validateAndProcessImageUrl(galleryFromBody);
        if (validatedUrl) {
          galleryPaths.push(validatedUrl);
        }
      }
    }

    // Handle images array (new field)
    if (images) {
      if (Array.isArray(images)) {
        const validatedImageUrls = validateAndProcessGalleryUrls(images);
        imageUrls = validatedImageUrls;
      } else if (typeof images === 'string') {
        const validatedUrl = validateAndProcessImageUrl(images);
        if (validatedUrl) {
          imageUrls = [validatedUrl];
        }
      }
    }

    // If images array is empty but gallery has values, use gallery for images
    if (imageUrls.length === 0 && galleryPaths.length > 0) {
      imageUrls = galleryPaths;
    }

    // Handle videos - file uploads first
    let videoUrls = [];
    if (req.files && req.files.videos && req.files.videos.length > 0) {
      // Handle uploaded video files
      req.files.videos.forEach(file => {
        // Check if file is a video (stored in videos directory)
        if (file.mimetype && file.mimetype.startsWith('video/')) {
          videoUrls.push(`/uploads/videos/${file.filename}`);
        }
      });
    }
    
    // Handle videos array from body (URLs)
    if (videos) {
      if (Array.isArray(videos)) {
        const validatedVideoUrls = videos.filter(url => {
          if (!url || typeof url !== 'string') return false;
          try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
          } catch {
            return false;
          }
        });
        videoUrls = [...videoUrls, ...validatedVideoUrls];
      } else if (typeof videos === 'string') {
        try {
          const urlObj = new URL(videos);
          if (['http:', 'https:'].includes(urlObj.protocol)) {
            videoUrls.push(videos);
          }
        } catch {
          // Invalid URL, skip
        }
      }
    }

    // Generate slug if not provided
    let venueSlug = slug;
    if (!venueSlug && name) {
      venueSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Ensure uniqueness by appending timestamp if needed
      const existingVenue = await Venue.findOne({ slug: venueSlug });
      if (existingVenue) {
        venueSlug = `${venueSlug}-${Date.now()}`;
      }
    }

    // Build venue object
    const venueData = {
      vendorId: userId, // Always use authenticated user's ID for security
      name,
      capacity: capacityValue,
      status: status || 'pending' // New venues need admin approval unless specified
    };

    // Add optional fields if provided
    if (venueSlug) venueData.slug = venueSlug;
    if (description) venueData.description = description;
    if (about) venueData.about = about;
    if (price !== undefined) venueData.price = Number(price);
    
    // Handle pricingInfo
    if (pricingInfo && typeof pricingInfo === 'object') {
      venueData.pricingInfo = {
        vegPerPlate: pricingInfo.vegPerPlate ? Number(pricingInfo.vegPerPlate) : 0,
        nonVegPerPlate: pricingInfo.nonVegPerPlate ? Number(pricingInfo.nonVegPerPlate) : 0,
        rentalPrice: pricingInfo.rentalPrice ? Number(pricingInfo.rentalPrice) : 0,
        taxIncluded: pricingInfo.taxIncluded || false,
        decorationCost: pricingInfo.decorationCost || '',
        djCost: pricingInfo.djCost || ''
      };
    }
    
    // Handle legacy pricePerPlate - map to pricingInfo if pricingInfo not provided
    if (pricePerPlate && !pricingInfo) {
      venueData.pricePerPlate = {
        veg: pricePerPlate.veg ? Number(pricePerPlate.veg) : undefined,
        nonVeg: pricePerPlate.nonVeg ? Number(pricePerPlate.nonVeg) : undefined
      };
      if (!venueData.pricingInfo) {
        venueData.pricingInfo = {
          vegPerPlate: pricePerPlate.veg ? Number(pricePerPlate.veg) : 0,
          nonVegPerPlate: pricePerPlate.nonVeg ? Number(pricePerPlate.nonVeg) : 0,
          rentalPrice: price ? Number(price) : 0,
          taxIncluded: false,
          decorationCost: '',
          djCost: ''
        };
      }
    }
    
    if (venueType) venueData.venueType = venueType;
    if (categoryId) venueData.categoryId = categoryId;
    // Save menuId and subMenuId if provided (null values are allowed)
    venueData.menuId = menuId || null;
    venueData.subMenuId = subMenuId || null;
    console.log('💾 Saving venue with menuId:', venueData.menuId, 'subMenuId:', venueData.subMenuId);
    
    // Location is required - handle both string and object
    if (!location || (typeof location === 'string' && !location.trim())) {
      return res.status(400).json({ error: 'Location is required' });
    }
    
    // Handle location - can be object, JSON string (from FormData), or plain string
    let locationObj = location;
    if (typeof location === 'string') {
      try {
        // Try to parse as JSON (from FormData)
        locationObj = JSON.parse(location);
      } catch (e) {
        // If parsing fails, treat as plain string for backward compatibility
        locationObj = location.trim();
      }
    }
    
    // Validate state and city if location is an object
    if (typeof locationObj === 'object' && locationObj !== null) {
      const statesCitiesData = await import('../data/indianStatesCities.js');
      const { isValidState, isValidCity, getCitiesByState, indianStatesCities } = statesCitiesData;
      
      // Validate state if provided
      if (locationObj.state && locationObj.state.trim()) {
        const state = locationObj.state.trim();
        if (!isValidState(state)) {
          return res.status(400).json({ 
            error: 'Invalid state', 
            message: `"${state}" is not a valid Indian state. Please provide a valid state name.`,
            hint: 'Use GET /api/vendor/venues/states to get list of valid states'
          });
        }
        // Normalize state name (use exact key from data)
        const allStates = Object.keys(indianStatesCities);
        const matchedState = allStates.find(s => s.toLowerCase() === state.toLowerCase());
        if (matchedState) {
          locationObj.state = matchedState;
        }
      }
      
      // Validate city if state is provided
      if (locationObj.city && locationObj.city.trim() && locationObj.state) {
        const city = locationObj.city.trim();
        const state = locationObj.state.trim();
        if (!isValidCity(city, state)) {
          const validCities = getCitiesByState(state);
          return res.status(400).json({ 
            error: 'Invalid city', 
            message: `"${city}" is not a valid city in "${state}". Please provide a valid city name.`,
            hint: `Use GET /api/vendor/venues/cities?state=${encodeURIComponent(state)} to get list of valid cities for this state`,
            validCities: validCities.length > 0 ? validCities : []
          });
        }
        // Normalize city name (use exact name from data)
        const cities = getCitiesByState(state);
        const matchedCity = cities.find(c => c.toLowerCase() === city.toLowerCase());
        if (matchedCity) {
          locationObj.city = matchedCity;
        }
      }
    }
    
    // If it's an object after parsing, use it; otherwise use as string
    venueData.location = typeof locationObj === 'object' && locationObj !== null ? locationObj : locationObj;
    if (facilities) {
      venueData.facilities = Array.isArray(facilities) ? facilities : [facilities];
    }
    if (amenities) {
      venueData.amenities = Array.isArray(amenities) ? amenities : [amenities];
    }
    if (highlights) {
      venueData.highlights = Array.isArray(highlights) ? highlights : [highlights];
    }
    if (rooms !== undefined) {
      venueData.rooms = Number(rooms) || 0;
    }
    if (contact && typeof contact === 'object') {
      venueData.contact = {
        name: contact.name,
        phone: contact.phone,
        email: contact.email
      };
    }
    
    // Handle availability - can be object or JSON string (from FormData)
    let availabilityObj = availability;
    if (typeof availability === 'string') {
      try {
        availabilityObj = JSON.parse(availability);
      } catch (e) {
        // If parsing fails, treat as empty
        availabilityObj = null;
      }
    }
    if (availabilityObj && typeof availabilityObj === 'object') {
      venueData.availability = {
        status: availabilityObj.status || 'Open',
        availableDates: Array.isArray(availabilityObj.availableDates) ? availabilityObj.availableDates : [],
        openDays: Array.isArray(availabilityObj.openDays) ? availabilityObj.openDays : [],
        openTime: availabilityObj.openTime || '',
        closeTime: availabilityObj.closeTime || ''
      };
    }
    
    // Handle bookingInfo
    if (bookingInfo && typeof bookingInfo === 'object') {
      venueData.bookingInfo = {
        advanceRequired: bookingInfo.advanceRequired || '',
        cancellationPolicy: bookingInfo.cancellationPolicy || '',
        bookingContact: bookingInfo.bookingContact || contact || {}
      };
    }
    
    // Handle legacy bookingPolicy
    if (bookingPolicy && typeof bookingPolicy === 'object' && !bookingInfo) {
      venueData.bookingPolicy = {
        advancePercentage: bookingPolicy.advancePercentage ? Number(bookingPolicy.advancePercentage) : undefined,
        cancellationPolicy: bookingPolicy.cancellationPolicy
      };
    }
    
    // Handle ratingInfo
    if (ratingInfo && typeof ratingInfo === 'object') {
      venueData.ratingInfo = {
        average: ratingInfo.average ? Number(ratingInfo.average) : 0,
        totalReviews: ratingInfo.totalReviews ? Number(ratingInfo.totalReviews) : 0,
        reviews: Array.isArray(ratingInfo.reviews) ? ratingInfo.reviews : []
      };
    }
    
    if (tags) {
      venueData.tags = Array.isArray(tags) ? tags : [tags];
    }
    if (rating !== undefined) venueData.rating = Number(rating);
    if (isFeatured !== undefined) venueData.isFeatured = Boolean(isFeatured);
    
    // Handle images
    if (coverImagePath) venueData.coverImage = coverImagePath;
    if (imagePath) venueData.image = imagePath; // Legacy field
    if (imageUrls.length > 0) venueData.images = imageUrls;
    
    // Handle galleryInfo
    if (galleryInfo && typeof galleryInfo === 'object') {
      venueData.galleryInfo = {
        photos: Array.isArray(galleryInfo.photos) ? galleryInfo.photos : [],
        videos: Array.isArray(galleryInfo.videos) ? galleryInfo.videos : []
      };
    } else if (gallery && typeof gallery === 'object') {
      venueData.galleryInfo = {
        photos: Array.isArray(gallery.photos) ? gallery.photos : [],
        videos: Array.isArray(gallery.videos) ? gallery.videos : []
      };
    }
    
    if (galleryPaths.length > 0) {
      venueData.gallery = galleryPaths; // Legacy field
      if (!venueData.galleryInfo) {
        venueData.galleryInfo = {
          photos: galleryPaths,
          videos: []
        };
      } else {
        venueData.galleryInfo.photos = [...(venueData.galleryInfo.photos || []), ...galleryPaths];
      }
    }
    if (videoUrls.length > 0) {
      venueData.videos = videoUrls;
      if (venueData.galleryInfo) {
        venueData.galleryInfo.videos = [...(venueData.galleryInfo.videos || []), ...videoUrls];
      }
    }

    const venue = new Venue(venueData);

    await venue.save();
    await venue.populate('vendorId', 'name email phone');

    // Format response according to new structure
    const formattedVenue = await formatVenueResponse(venue);

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: formattedVenue
    });
  } catch (error) {
    console.error('Create venue error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      // Duplicate key error (e.g., duplicate slug)
      return res.status(400).json({ error: 'A venue with this slug already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update venue (vendor only, own venues)
export const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can update venues' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const venue = await Venue.findById(id);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if venue belongs to the vendor
    if (venue.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only update your own venues' });
    }

    const { name, price, location, capacity, amenities, highlights, rooms, image, categoryId, menuId, subMenuId, description, availability } = req.body;

    // Update fields if provided
    if (name !== undefined) venue.name = name.trim();
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }
      venue.price = Number(price);
    }
    if (description !== undefined) venue.description = description;
    
    // Handle location update - can be string or JSON string (from FormData)
    if (location !== undefined) {
      if (!location || (typeof location === 'string' && !location.trim())) {
        return res.status(400).json({ error: 'Location cannot be empty' });
      }
      let locationObj = location;
      if (typeof location === 'string') {
        try {
          locationObj = JSON.parse(location);
        } catch (e) {
          locationObj = location.trim();
        }
      }
      
      // Validate state and city if location is an object
      if (typeof locationObj === 'object' && locationObj !== null) {
        const statesCitiesData = await import('../data/indianStatesCities.js');
        const { isValidState, isValidCity, getCitiesByState, indianStatesCities } = statesCitiesData;
        
        // Validate state if provided
        if (locationObj.state && locationObj.state.trim()) {
          const state = locationObj.state.trim();
          if (!isValidState(state)) {
            return res.status(400).json({ 
              error: 'Invalid state', 
              message: `"${state}" is not a valid Indian state. Please provide a valid state name.`,
              hint: 'Use GET /api/vendor/venues/states to get list of valid states'
            });
          }
          // Normalize state name (use exact key from data)
          const allStates = Object.keys(indianStatesCities);
          const matchedState = allStates.find(s => s.toLowerCase() === state.toLowerCase());
          if (matchedState) {
            locationObj.state = matchedState;
          }
        }
        
        // Validate city if state is provided
        if (locationObj.city && locationObj.city.trim() && locationObj.state) {
          const city = locationObj.city.trim();
          const state = locationObj.state.trim();
          if (!isValidCity(city, state)) {
            const validCities = getCitiesByState(state);
            return res.status(400).json({ 
              error: 'Invalid city', 
              message: `"${city}" is not a valid city in "${state}". Please provide a valid city name.`,
              hint: `Use GET /api/vendor/venues/cities?state=${encodeURIComponent(state)} to get list of valid cities for this state`,
              validCities: validCities.length > 0 ? validCities : []
            });
          }
          // Normalize city name (use exact name from data)
          const cities = getCitiesByState(state);
          const matchedCity = cities.find(c => c.toLowerCase() === city.toLowerCase());
          if (matchedCity) {
            locationObj.city = matchedCity;
          }
        }
      }
      
      venue.location = typeof locationObj === 'object' && locationObj !== null ? locationObj : locationObj;
    }
    if (capacity !== undefined) {
      if (capacity <= 0) {
        return res.status(400).json({ error: 'Capacity must be greater than 0' });
      }
      venue.capacity = Number(capacity);
    }
    if (amenities !== undefined) {
      venue.amenities = Array.isArray(amenities) ? amenities : [amenities];
    }
    if (highlights !== undefined) {
      venue.highlights = Array.isArray(highlights) ? highlights : [highlights];
    }
    if (rooms !== undefined) {
      venue.rooms = Number(rooms) || 0;
    }
    
    // Handle availability update
    if (availability !== undefined) {
      let availabilityObj = availability;
      if (typeof availability === 'string') {
        try {
          availabilityObj = JSON.parse(availability);
        } catch (e) {
          availabilityObj = null;
        }
      }
      if (availabilityObj && typeof availabilityObj === 'object') {
        venue.availability = {
          status: availabilityObj.status || venue.availability?.status || 'Open',
          availableDates: Array.isArray(availabilityObj.availableDates) ? availabilityObj.availableDates : (venue.availability?.availableDates || []),
          openDays: Array.isArray(availabilityObj.openDays) ? availabilityObj.openDays : (venue.availability?.openDays || []),
          openTime: availabilityObj.openTime || venue.availability?.openTime || '',
          closeTime: availabilityObj.closeTime || venue.availability?.closeTime || ''
        };
      }
    }

    // Handle categoryId update
    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === '') {
        // Allow removing category
        venue.categoryId = null;
      } else {
        // Validate categoryId if provided
        const Category = (await import('../models/Category.js')).default;
        const category = await Category.findById(categoryId);
        if (!category) {
          return res.status(400).json({ error: 'Invalid category ID' });
        }
        if (!category.isActive) {
          return res.status(400).json({ error: 'Category is not active' });
        }
        venue.categoryId = categoryId;
      }
    }

    // Normalize menuId and subMenuId - handle empty strings (same as create)
    let normalizedMenuId = menuId;
    let normalizedSubMenuId = subMenuId;
    if (menuId !== undefined) {
      if (menuId === '' || menuId === null) {
        normalizedMenuId = null;
      }
    }
    if (subMenuId !== undefined) {
      if (subMenuId === '' || subMenuId === null) {
        normalizedSubMenuId = null;
      }
    }

    // Handle menuId update
    if (normalizedMenuId !== undefined) {
      if (normalizedMenuId === null) {
        // Allow removing menu
        venue.menuId = null;
        // Also remove subMenuId if menu is removed
        if (venue.subMenuId) {
          venue.subMenuId = null;
        }
        console.log('🗑️ Removed menuId from venue');
      } else {
        // Validate menuId if provided
        const Menu = (await import('../models/Menu.js')).default;
        const menu = await Menu.findById(normalizedMenuId);
        if (!menu) {
          return res.status(400).json({ error: 'Invalid menu ID' });
        }
        if (!menu.isActive) {
          return res.status(400).json({ error: 'Menu is not active' });
        }
        // Ensure it's a main menu
        if (menu.parentMenuId) {
          return res.status(400).json({ error: 'menuId must be a main menu, not a submenu' });
        }
        venue.menuId = normalizedMenuId;
        console.log('✅ Updated menuId:', normalizedMenuId, 'Menu name:', menu.name);
        // If subMenuId exists but doesn't belong to new menuId, remove it
        if (venue.subMenuId) {
          const submenu = await Menu.findById(venue.subMenuId);
          if (!submenu || submenu.parentMenuId?.toString() !== normalizedMenuId) {
            venue.subMenuId = null;
            console.log('🗑️ Removed subMenuId as it doesn\'t belong to new menuId');
          }
        }
      }
    }

    // Handle subMenuId update
    if (normalizedSubMenuId !== undefined) {
      if (normalizedSubMenuId === null) {
        // Allow removing submenu
        venue.subMenuId = null;
        console.log('🗑️ Removed subMenuId from venue');
      } else {
        // Validate subMenuId if provided
        const Menu = (await import('../models/Menu.js')).default;
        const submenu = await Menu.findById(normalizedSubMenuId);
        if (!submenu) {
          return res.status(400).json({ error: 'Invalid submenu ID' });
        }
        if (!submenu.isActive) {
          return res.status(400).json({ error: 'Submenu is not active' });
        }
        // Ensure it's a submenu
        if (!submenu.parentMenuId) {
          return res.status(400).json({ error: 'subMenuId must be a submenu' });
        }
        // Ensure menuId matches parent (or set it if not set)
        const parentMenuId = submenu.parentMenuId.toString();
        if (venue.menuId && venue.menuId.toString() !== parentMenuId) {
          return res.status(400).json({ error: 'subMenuId must belong to the venue\'s menuId' });
        }
        venue.subMenuId = normalizedSubMenuId;
        console.log('✅ Updated subMenuId:', normalizedSubMenuId, 'Submenu name:', submenu.name);
        // Set menuId if not already set
        if (!venue.menuId) {
          venue.menuId = submenu.parentMenuId;
          console.log('ℹ️ Auto-set menuId from subMenuId parent:', venue.menuId);
        }
      }
    }

    // Handle image updates
    // Support image update via file upload
    if (req.files && req.files.image && req.files.image[0]) {
      // Delete old image file if exists
      if (venue.image) {
        deleteImageFile(venue.image);
      }
      venue.image = `/uploads/venues/${req.files.image[0].filename}`;
    }
    // Support image update via body (URL or null to remove)
    else if (req.body.image !== undefined) {
      if (req.body.image === null || req.body.image === '') {
        // Remove image
        if (venue.image) {
          deleteImageFile(venue.image);
        }
        venue.image = null;
      } else if (req.body.image !== venue.image) {
        // Validate network image URL
        const validatedUrl = validateAndProcessImageUrl(req.body.image);
        if (!validatedUrl) {
          return res.status(400).json({ 
            error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
          });
        }
        
        // Update with new URL, delete old file if it was a local file
        if (venue.image && !venue.image.includes('http')) {
          deleteImageFile(venue.image);
        }
        venue.image = validatedUrl;
      }
    }

    // Handle gallery updates
    const existingGalleryPhotos = normalizeGalleryPhotos(venue.gallery);
    const uploadedGalleryPaths =
      (req.files && req.files.gallery && req.files.gallery.length > 0)
        ? req.files.gallery.map(file => `/uploads/venues/${file.filename}`)
        : [];

    // Support gallery update via body (URLs or local /uploads paths)
    // NOTE: Frontend vendor editor sends existing gallery URLs in body while editing.
    // We must NOT delete files that are still referenced in the new gallery list.
    if (req.body.gallery !== undefined) {
      const bodyGalleryRaw = Array.isArray(req.body.gallery)
        ? req.body.gallery
        : (typeof req.body.gallery === 'string' && req.body.gallery.trim()
            ? [req.body.gallery]
            : []);

      const validatedBodyUrls = validateAndProcessGalleryUrls(bodyGalleryRaw);
      const nextGallery = [...validatedBodyUrls, ...uploadedGalleryPaths];

      // Delete only removed local files (diff-based), not everything.
      const toDelete = existingGalleryPhotos
        .filter(p => typeof p === 'string' && p.startsWith('/uploads/venues/'))
        .filter(p => !nextGallery.includes(p));
      if (toDelete.length > 0) {
        deleteGalleryFiles(toDelete);
      }

      venue.gallery = nextGallery;
    } else if (uploadedGalleryPaths.length > 0) {
      if (req.body.replaceGallery === 'true') {
        // Replace entire gallery - delete old local files (safe even if gallery had remote URLs)
        const toDelete = existingGalleryPhotos
          .filter(p => typeof p === 'string' && p.startsWith('/uploads/venues/'))
          .filter(p => !uploadedGalleryPaths.includes(p));
        if (toDelete.length > 0) {
          deleteGalleryFiles(toDelete);
        }
        venue.gallery = uploadedGalleryPaths;
      } else {
        // Merge with existing gallery (legacy behavior)
        venue.gallery = [...existingGalleryPhotos, ...uploadedGalleryPaths];
      }
    }

    // Handle videos - file uploads first
    if (req.files && req.files.videos && req.files.videos.length > 0) {
      const newVideoPaths = req.files.videos
        .filter(file => file.mimetype && file.mimetype.startsWith('video/'))
        .map(file => `/uploads/videos/${file.filename}`);
      
      if (newVideoPaths.length > 0) {
        // Merge with existing videos
        const existingVideos = venue.videos || venue.galleryInfo?.videos || []
        venue.videos = [...existingVideos, ...newVideoPaths]
        
        // Update galleryInfo if it exists
        if (venue.galleryInfo) {
          venue.galleryInfo.videos = [...(venue.galleryInfo.videos || []), ...newVideoPaths]
        } else {
          venue.galleryInfo = {
            photos: venue.gallery || [],
            videos: newVideoPaths
          }
        }
      }
    }
    
    // Handle videos from body (URLs)
    const { videos } = req.body
    if (videos !== undefined) {
      let videoUrls = []
      if (Array.isArray(videos)) {
        videoUrls = videos.filter(url => {
          if (!url || typeof url !== 'string') return false
          try {
            const urlObj = new URL(url)
            return ['http:', 'https:'].includes(urlObj.protocol)
          } catch {
            return false
          }
        })
      } else if (typeof videos === 'string' && videos.trim()) {
        try {
          const urlObj = new URL(videos)
          if (['http:', 'https:'].includes(urlObj.protocol)) {
            videoUrls = [videos]
          }
        } catch {
          // Invalid URL, skip
        }
      }
      
      if (videoUrls.length > 0) {
        const existingVideos = venue.videos || []
        venue.videos = [...existingVideos, ...videoUrls]
        
        // Update galleryInfo if it exists
        if (venue.galleryInfo) {
          venue.galleryInfo.videos = [...(venue.galleryInfo.videos || []), ...videoUrls]
        } else {
          venue.galleryInfo = {
            photos: venue.gallery || [],
            videos: videoUrls
          }
        }
      }
    }

    // If venue was rejected and vendor updates it, reset to pending
    if (venue.status === 'rejected') {
      venue.status = 'pending';
    }

    await venue.save();
    await venue.populate('vendorId', 'name email phone');

    res.json({
      success: true,
      message: 'Venue updated successfully',
      venue
    });
  } catch (error) {
    console.error('Update venue error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle venue active/inactive status (vendor only, own venues)
export const toggleVenueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can toggle venue status' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const venue = await Venue.findById(id);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if venue belongs to the vendor
    if (venue.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only toggle status of your own venues' });
    }

    // Only allow toggling if venue is approved or active
    if (venue.status !== 'approved' && venue.status !== 'active') {
      return res.status(400).json({ 
        error: 'Cannot toggle status. Venue must be approved first.',
        currentStatus: venue.status
      });
    }

    // Vendor toggle controls vendorActive flag only; admin status stays as is
    const newVendorActive = venue.vendorActive === false ? true : false;
    venue.vendorActive = newVendorActive;
    await venue.save();

    res.json({
      success: true,
      message: `Venue ${newVendorActive ? 'activated' : 'deactivated'} successfully`,
      venue: {
        id: venue._id,
        name: venue.name,
        status: venue.status,
        vendorActive: venue.vendorActive
      }
    });
  } catch (error) {
    console.error('Toggle venue status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete venue (vendor only, own venues)
export const deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can delete venues' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const venue = await Venue.findById(id);

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if venue belongs to the vendor
    if (venue.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own venues' });
    }

    // Delete associated image files before deleting venue
    if (venue.image) {
      deleteImageFile(venue.image);
    }
    if (venue.gallery && venue.gallery.length > 0) {
      deleteGalleryFiles(venue.gallery);
    }

    await Venue.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    console.error('Delete venue error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search venues - dedicated search API
// Excludes deleted/rejected venues, supports location filtering
export const searchVenues = async (req, res) => {
  try {
    // Check MongoDB connection with timeout
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 8000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const { 
      q, // Search query (name, description, location)
      city,
      state,
      location, // General location search
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Base filter - exclude rejected/deleted venues, only show approved/active and vendorActive not false (treat undefined as true)
    let filter = {
      status: { $in: ['approved', 'active'] },
      vendorActive: { $ne: false }
    };

    // Search query - search in name, description, location fields
    if (q && q.trim()) {
      const searchTerm = q.trim();
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { about: searchRegex },
        { slug: searchRegex },
        { location: searchRegex }, // String location
        { 'location.address': searchRegex },
        { 'location.city': searchRegex },
        { 'location.state': searchRegex },
        { 'location.pincode': searchRegex },
        { venueType: searchRegex },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }

    // Location filtering - city
    if (city && city.trim()) {
      const cityFilter = { $regex: city.trim(), $options: 'i' };
      if (filter.$or) {
        // If search query exists, add city to $and
        if (!filter.$and) filter.$and = [];
        filter.$and.push({
          $or: [
            { 'location.city': cityFilter },
            { location: cityFilter } // Also search in string location
          ]
        });
      } else {
        filter.$or = [
          { 'location.city': cityFilter },
          { location: cityFilter }
        ];
      }
    }

    // Location filtering - state
    if (state && state.trim()) {
      const stateFilter = { $regex: state.trim(), $options: 'i' };
      if (filter.$or || filter.$and) {
        // If other filters exist, add state to $and
        if (!filter.$and) filter.$and = [];
        filter.$and.push({
          $or: [
            { 'location.state': stateFilter },
            { location: stateFilter } // Also search in string location
          ]
        });
      } else {
        filter.$or = [
          { 'location.state': stateFilter },
          { location: stateFilter }
        ];
      }
    }

    // General location search (address, city, state, pincode)
    if (location && location.trim()) {
      const locationFilter = { $regex: location.trim(), $options: 'i' };
      const locationSearch = {
        $or: [
          { location: locationFilter },
          { 'location.address': locationFilter },
          { 'location.city': locationFilter },
          { 'location.state': locationFilter },
          { 'location.pincode': locationFilter }
        ]
      };
      
      if (filter.$or || filter.$and) {
        if (!filter.$and) filter.$and = [];
        filter.$and.push(locationSearch);
      } else {
        filter.$or = locationSearch.$or;
      }
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    // Execute query
    const queryPromise = Venue.find(filter)
      .populate('vendorId', 'name email phone')
      .populate('categoryId', 'name description icon image')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .maxTimeMS(10000);

    const countPromise = Venue.countDocuments(filter).maxTimeMS(10000);

    const [venues, totalCount] = await Promise.all([
      withTimeout(queryPromise, 15000),
      withTimeout(countPromise, 15000)
    ]);

    // Format venues
    const formattedVenues = await Promise.all(venues.map(venue => formatVenueResponse(venue)));

    res.json({
      success: true,
      query: q || '',
      filters: {
        city: city || null,
        state: state || null,
        location: location || null
      },
      count: formattedVenues.length,
      totalCount: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      limit: limitNum,
      venues: formattedVenues
    });
  } catch (error) {
    console.error('Search venues error:', error);
    
    // Handle timeout errors
    if (error.message && error.message.includes('timed out')) {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'The search query took too long. Please try again or contact support.'
      });
    }
    
    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        error: 'Database error',
        hint: 'Unable to connect to database. Please try again later.'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all Indian states - Public API
export const getStates = async (req, res) => {
  try {
    const { getAllStates } = await import('../data/indianStatesCities.js');
    const states = getAllStates();
    
    res.json({
      success: true,
      count: states.length,
      states: states
    });
  } catch (error) {
    console.error('Error getting states:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get cities by state - Public API
export const getCities = async (req, res) => {
  try {
    const { state } = req.query;
    
    if (!state || !state.trim()) {
      return res.status(400).json({ 
        error: 'State parameter is required',
        message: 'Please provide a state name in the query parameter',
        example: '/api/vendor/venues/cities?state=Maharashtra'
      });
    }
    
    const { getCitiesByState, isValidState, indianStatesCities } = await import('../data/indianStatesCities.js');
    
    // Check if state is valid
    const stateName = state.trim();
    if (!isValidState(stateName)) {
      // Try to find a case-insensitive match
      const allStates = Object.keys(indianStatesCities);
      const matchedState = allStates.find(s => s.toLowerCase() === stateName.toLowerCase());
      
      if (matchedState) {
        const cities = getCitiesByState(matchedState);
        return res.json({
          success: true,
          state: matchedState,
          count: cities.length,
          cities: cities
        });
      }
      
      return res.status(400).json({ 
        error: 'Invalid state',
        message: `"${stateName}" is not a valid Indian state`,
        hint: 'Use GET /api/vendor/venues/states to get list of valid states',
        providedState: stateName
      });
    }
    
    const cities = getCitiesByState(stateName);
    
    res.json({
      success: true,
      state: stateName,
      count: cities.length,
      cities: cities
    });
  } catch (error) {
    console.error('Error getting cities:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get search suggestions - Public API
// Returns suggestions for venue names, cities, states, and tags
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || !q.trim()) {
      return res.json({
        success: true,
        query: '',
        suggestions: {
          venues: [],
          cities: [],
          states: [],
          tags: []
        }
      });
    }

    const searchTerm = q.trim().toLowerCase();
    const limitNum = Math.min(parseInt(limit) || 10, 20); // Max 20 suggestions per category

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 8000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Base filter - only approved/active venues
    const baseFilter = {
      status: { $in: ['approved', 'active'] }
    };

    const searchRegex = { $regex: searchTerm, $options: 'i' };

    // Get venue name suggestions
    const venueNames = await Venue.find({
      ...baseFilter,
      name: searchRegex
    })
      .select('name')
      .limit(limitNum)
      .maxTimeMS(5000)
      .lean();

    // Get unique city suggestions
    const citiesWithVenues = await Venue.find({
      ...baseFilter,
      $or: [
        { 'location.city': searchRegex },
        { location: searchRegex }
      ]
    })
      .select('location.city location')
      .limit(limitNum * 2) // Get more to filter unique
      .maxTimeMS(5000)
      .lean();

    // Get unique state suggestions
    const statesWithVenues = await Venue.find({
      ...baseFilter,
      $or: [
        { 'location.state': searchRegex },
        { location: searchRegex }
      ]
    })
      .select('location.state location')
      .limit(limitNum * 2) // Get more to filter unique
      .maxTimeMS(5000)
      .lean();

    // Get tag suggestions
    const venuesWithTags = await Venue.find({
      ...baseFilter,
      tags: { $in: [new RegExp(searchTerm, 'i')] }
    })
      .select('tags')
      .limit(limitNum * 2)
      .maxTimeMS(5000)
      .lean();

    // Process and deduplicate suggestions
    const venueSuggestions = [...new Set(
      venueNames
        .map(v => v.name)
        .filter(name => name && name.toLowerCase().includes(searchTerm))
    )].slice(0, limitNum);

    // Extract and deduplicate cities
    const citySet = new Set();
    citiesWithVenues.forEach(venue => {
      if (venue.location) {
        if (typeof venue.location === 'object' && venue.location.city) {
          const city = venue.location.city;
          if (city && city.toLowerCase().includes(searchTerm)) {
            citySet.add(city);
          }
        } else if (typeof venue.location === 'string' && venue.location.toLowerCase().includes(searchTerm)) {
          // Try to extract city from string location
          const parts = venue.location.split(',').map(p => p.trim());
          parts.forEach(part => {
            if (part.toLowerCase().includes(searchTerm)) {
              citySet.add(part);
            }
          });
        }
      }
    });
    const citySuggestions = Array.from(citySet).slice(0, limitNum);

    // Extract and deduplicate states
    const stateSet = new Set();
    statesWithVenues.forEach(venue => {
      if (venue.location) {
        if (typeof venue.location === 'object' && venue.location.state) {
          const state = venue.location.state;
          if (state && state.toLowerCase().includes(searchTerm)) {
            stateSet.add(state);
          }
        } else if (typeof venue.location === 'string' && venue.location.toLowerCase().includes(searchTerm)) {
          // Try to extract state from string location
          const parts = venue.location.split(',').map(p => p.trim());
          parts.forEach(part => {
            if (part.toLowerCase().includes(searchTerm)) {
              stateSet.add(part);
            }
          });
        }
      }
    });
    const stateSuggestions = Array.from(stateSet).slice(0, limitNum);

    // Extract and deduplicate tags
    const tagSet = new Set();
    venuesWithTags.forEach(venue => {
      if (venue.tags && Array.isArray(venue.tags)) {
        venue.tags.forEach(tag => {
          if (tag && typeof tag === 'string' && tag.toLowerCase().includes(searchTerm)) {
            tagSet.add(tag);
          }
        });
      }
    });
    const tagSuggestions = Array.from(tagSet).slice(0, limitNum);

    // Also check Indian states and cities data for suggestions
    const { indianStatesCities, searchCities } = await import('../data/indianStatesCities.js');
    
    // Add matching states from Indian states data
    const allStates = Object.keys(indianStatesCities);
    allStates.forEach(state => {
      if (state.toLowerCase().includes(searchTerm) && !stateSuggestions.includes(state)) {
        stateSuggestions.push(state);
      }
    });
    const uniqueStateSuggestions = [...new Set(stateSuggestions)].slice(0, limitNum);

    // Add matching cities from Indian cities data
    const cityMatches = searchCities(searchTerm);
    cityMatches.forEach(({ city: cityName }) => {
      if (!citySuggestions.includes(cityName)) {
        citySuggestions.push(cityName);
      }
    });
    const uniqueCitySuggestions = [...new Set(citySuggestions)].slice(0, limitNum);

    res.json({
      success: true,
      query: searchTerm,
      suggestions: {
        venues: venueSuggestions,
        cities: uniqueCitySuggestions,
        states: uniqueStateSuggestions,
        tags: tagSuggestions
      },
      counts: {
        venues: venueSuggestions.length,
        cities: uniqueCitySuggestions.length,
        states: uniqueStateSuggestions.length,
        tags: tagSuggestions.length
      }
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    
    // Handle timeout errors
    if (error.message && error.message.includes('timed out')) {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'The search query took too long. Please try again.'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



