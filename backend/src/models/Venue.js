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
    // Multiple pricing types - array of pricing objects
    pricingTypes: [{
      type: {
        type: String,
        enum: ['per_day', 'per_plate', 'per_km', 'hours_price'],
        required: true
      },
      price: {
        type: Number,
        default: 0
      },
      // For per_plate type
      vegPrice: {
        type: Number,
        default: 0
      },
      nonVegPrice: {
        type: Number,
        default: 0
      }
    }],
    venueType: {
      type: String,
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    vendorCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorCategory',
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
    decorationCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DecorationCategory',
      default: null
    },
    occasionSpecialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OccasionSpecial',
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
      type: mongoose.Schema.Types.Mixed, // Can be array of strings (legacy) or array of objects { name, count }
      default: []
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
    // Verified listing status - set when vendor purchases a plan
    verifiedListing: {
      type: Boolean,
      default: false
    },
    verifiedListingExpiry: {
      type: Date,
      default: null
    },
    verifiedListingPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null
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
    }],
    services: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      price: {
        type: Number,
        default: null, // null means price is optional/not set
        min: 0
      },
      description: {
        type: String,
        trim: true
      }
    }],
    // SEO fields for meta tags
    metaTitle: {
      type: String,
      trim: true
    },
    metaDescription: {
      type: String,
      trim: true
    },
    // Areas Available - Array of area objects
    areasAvailable: [{
      vendorAreaName: {
        type: String,
        required: true,
        trim: true
      },
      areaType: {
        type: String,
        required: true,
        trim: true
      },
      seating: {
        type: String,
        trim: true
      },
      floating: {
        type: String,
        trim: true
      },
      parkingSpaces: {
        type: String,
        trim: true
      },
      vehicleCapacity: {
        type: String,
        trim: true
      }
    }],
    // FAQ - Array of FAQ objects
    faq: [{
      question: {
        type: String,
        required: true,
        trim: true
      },
      answer: {
        type: String,
        required: true,
        trim: true
      }
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
venueSchema.index({ verifiedListing: 1 });
venueSchema.index({ verifiedListingExpiry: 1 });
venueSchema.index({ categoryId: 1 });
venueSchema.index({ menuId: 1 });
venueSchema.index({ subMenuId: 1 });
venueSchema.index({ decorationCategoryId: 1 });
venueSchema.index({ occasionSpecialId: 1 });

export default mongoose.model('Venue', venueSchema);
