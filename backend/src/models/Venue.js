import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    about: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      default: 0
    },
    pricePerPlate: {
      veg: {
        type: Number,
        default: 0
      },
      nonVeg: {
        type: Number,
        default: 0
      }
    },
    pricingInfo: {
      vegPerPlate: {
        type: Number,
        default: 0
      },
      nonVegPerPlate: {
        type: Number,
        default: 0
      },
      rentalPrice: {
        type: Number,
        default: 0
      },
      taxIncluded: {
        type: Boolean,
        default: false
      },
      decorationCost: {
        type: String,
        trim: true
      },
      djCost: {
        type: String,
        trim: true
      }
    },
    venueType: {
      type: String,
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      default: null
    },
    subMenuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      default: null
    },
    location: {
      type: mongoose.Schema.Types.Mixed, // Can be string or object
      required: true
    },
    capacity: {
      type: mongoose.Schema.Types.Mixed, // Can be Number (legacy) or Object with minGuests/maxGuests
      required: true
    },
    facilities: [{
      type: String,
      trim: true
    }],
    amenities: [{
      type: String,
      trim: true
    }],
    highlights: [{
      type: String,
      trim: true
    }],
    rooms: {
      type: Number,
      default: 0,
      min: 0
    },
    image: {
      type: String, // Legacy field for single image
      trim: true
    },
    coverImage: {
      type: String,
      trim: true
    },
    images: [{
      type: String,
      trim: true
    }],
    gallery: {
      type: mongoose.Schema.Types.Mixed, // Can be array (legacy) or object with photos/videos
    },
    galleryInfo: {
      photos: [{
        type: String,
        trim: true
      }],
      videos: [{
        type: String,
        trim: true
      }]
    },
    videos: [{
      type: String,
      trim: true
    }],
    contact: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      }
    },
    availability: {
      status: {
        type: String,
        enum: ['Open', 'Closed', 'Limited'],
        default: 'Open'
      },
      availableDates: [{
        type: String // ISO date strings
      }],
      openDays: [{
        type: String
      }],
      openTime: {
        type: String
      },
      closeTime: {
        type: String
      }
    },
    bookingPolicy: {
      advancePercentage: {
        type: Number,
        min: 0,
        max: 100
      },
      cancellationPolicy: {
        type: String,
        trim: true
      }
    },
    bookingInfo: {
      advanceRequired: {
        type: String,
        trim: true
      },
      cancellationPolicy: {
        type: String,
        trim: true
      },
      bookingContact: {
        name: {
          type: String,
          trim: true
        },
        phone: {
          type: String,
          trim: true
        },
        email: {
          type: String,
          trim: true,
          lowercase: true
        }
      }
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    ratingInfo: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      totalReviews: {
        type: Number,
        default: 0,
        min: 0
      },
      reviews: [{
        user: {
          type: String,
          trim: true
        },
        rating: {
          type: Number,
          min: 0,
          max: 5
        },
        comment: {
          type: String,
          trim: true
        },
        date: {
          type: String
        }
      }]
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active'],
      default: 'pending'
    },
  // Vendor-controlled visibility (independent of admin approval)
  vendorActive: {
    type: Boolean,
    default: true
  },
    bookingButtonEnabled: {
      type: Boolean,
      default: true
    },
    leadsButtonEnabled: {
      type: Boolean,
      default: true
    },
    blockedDates: [{
      type: Date,
      required: true
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
venueSchema.index({ vendorId: 1 });
venueSchema.index({ status: 1 });
venueSchema.index({ location: 1 });
venueSchema.index({ slug: 1 });
venueSchema.index({ 'location.city': 1 });
venueSchema.index({ 'location.state': 1 });
venueSchema.index({ venueType: 1 });
venueSchema.index({ rating: -1 });
venueSchema.index({ 'ratingInfo.average': -1 });
venueSchema.index({ 'capacity.minGuests': 1 });
venueSchema.index({ 'capacity.maxGuests': 1 });
venueSchema.index({ isFeatured: 1 });
venueSchema.index({ categoryId: 1 });
venueSchema.index({ menuId: 1 });
venueSchema.index({ subMenuId: 1 });

export default mongoose.model('Venue', venueSchema);
