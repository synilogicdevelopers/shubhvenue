import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './src/config/db.js';
import Category from './src/models/Category.js';
import Venue from './src/models/Venue.js';
import User from './src/models/User.js';

// Load environment variables
dotenv.config();

// Banquet Hall Venue Data
const banquetHallVenue = {
  name: "Grand Royal Banquet Hall",
  slug: "grand-royal-banquet-hall",
  description: "A luxurious banquet hall perfect for weddings, receptions, and grand celebrations. Features elegant interiors, spacious halls, and world-class amenities.",
  about: "Grand Royal Banquet Hall is one of the most prestigious venues in the city, offering elegant spaces for weddings, receptions, corporate events, and social gatherings. With state-of-the-art facilities, professional catering services, and impeccable service, we ensure your special day is memorable.",
  venueType: "Banquet Hall",
  location: {
    address: "123 Main Street, Near City Center",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    pincode: "302001",
    latitude: 26.9124,
    longitude: 75.7873
  },
  capacity: {
    minGuests: 100,
    maxGuests: 1000
  },
  price: 50000,
  pricingInfo: {
    vegPerPlate: 1200,
    nonVegPerPlate: 1500,
    rentalPrice: 50000,
    taxIncluded: false,
    decorationCost: "Starting from ₹50,000",
    djCost: "Starting from ₹15,000"
  },
  pricePerPlate: {
    veg: 1200,
    nonVeg: 1500
  },
  pricingTypes: [
    {
      type: "per_day",
      price: 50000
    },
    {
      type: "per_plate",
      vegPrice: 1200,
      nonVegPrice: 1500
    }
  ],
  facilities: [
    "Parking",
    "WiFi",
    "AC Hall",
    "Bridal Room",
    "DJ",
    "Catering",
    "Power Backup",
    "Sound System",
    "Lighting",
    "Stage",
    "Projector",
    "Generator"
  ],
  amenities: [
    "Valet Parking",
    "Power Backup",
    "Changing Rooms",
    "Security Staff",
    "Elevator",
    "Wheelchair Accessible",
    "Air Conditioning",
    "Fire Safety",
    "First Aid",
    "Restrooms",
    "Green Room",
    "Storage Space"
  ],
  highlights: [
    "Luxury Banquet Hall",
    "Spacious Indoor Area",
    "Elegant Decor",
    "Professional Catering",
    "Experienced Event Managers",
    "Prime Location",
    "Ample Parking",
    "Modern Amenities"
  ],
  rooms: [
    { name: "Main Banquet Hall", count: 1 },
    { name: "Bridal Room", count: 2 },
    { name: "Green Room", count: 1 },
    { name: "Storage Room", count: 2 }
  ],
  areasAvailable: [
    {
      vendorAreaName: "Main Banquet Hall",
      areaType: "Banquet Hall",
      seating: "1000",
      floating: "1200"
    },
    {
      vendorAreaName: "Outdoor Lawn",
      areaType: "Lawn",
      seating: "500",
      floating: "600"
    },
    {
      vendorAreaName: "Bridal Suite",
      areaType: "Bridal Room",
      seating: "10",
      floating: "15"
    },
    {
      vendorAreaName: "Parking Area",
      areaType: "Parking Area",
      seating: "200",
      floating: "250"
    }
  ],
  services: [
    {
      name: "Event Planning",
      price: 25000,
      description: "Complete event planning and coordination"
    },
    {
      name: "Decoration",
      price: null,
      description: "Custom decoration packages available"
    },
    {
      name: "Catering",
      price: null,
      description: "Veg and Non-Veg catering options"
    },
    {
      name: "Photography",
      price: 15000,
      description: "Professional photography services"
    },
    {
      name: "Videography",
      price: 20000,
      description: "HD videography services"
    }
  ],
  contact: {
    name: "Rajesh Kumar",
    phone: "+91 9876543210",
    email: "info@grandroyalbanquet.com"
  },
  availability: {
    status: "Open",
    openDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    openTime: "09:00",
    closeTime: "23:00"
  },
  bookingPolicy: {
    advancePercentage: 30,
    cancellationPolicy: "Full refund if cancelled 7 days before event. 50% refund if cancelled 3-7 days before. No refund if cancelled less than 3 days before."
  },
  bookingInfo: {
    advanceRequired: "30% advance payment required at the time of booking",
    cancellationPolicy: "Full refund if cancelled 7 days before event",
    bookingContact: {
      name: "Rajesh Kumar",
      phone: "+91 9876543210",
      email: "booking@grandroyalbanquet.com"
    }
  },
  tags: ["luxury", "wedding", "banquet", "5-star", "premium", "elegant", "spacious"],
  rating: 4.8,
  ratingInfo: {
    average: 4.8,
    totalReviews: 125,
    reviews: [
      {
        user: "Priya Sharma",
        rating: 5,
        comment: "Amazing venue! The staff was very professional and the hall was beautifully decorated.",
        date: "2024-01-15"
      },
      {
        user: "Amit Patel",
        rating: 4.5,
        comment: "Great experience. Food was delicious and the venue is spacious.",
        date: "2024-01-10"
      }
    ]
  },
  faq: [
    {
      question: "What is the maximum capacity?",
      answer: "The main hall can accommodate up to 1000 guests in seating arrangement and 1200 guests in floating arrangement."
    },
    {
      question: "Is parking available?",
      answer: "Yes, we have ample parking space for up to 200 cars with valet parking service available."
    },
    {
      question: "Do you provide catering?",
      answer: "Yes, we provide both vegetarian and non-vegetarian catering services. You can also bring your own caterer."
    },
    {
      question: "What is included in the rental price?",
      answer: "The rental price includes the hall, basic lighting, sound system, and basic decoration. Additional services like catering, decoration, and entertainment are charged separately."
    },
    {
      question: "Can we visit the venue before booking?",
      answer: "Yes, you can visit the venue by appointment. Please contact us to schedule a visit."
    },
    {
      question: "What is the cancellation policy?",
      answer: "Full refund if cancelled 7 days before event. 50% refund if cancelled 3-7 days before. No refund if cancelled less than 3 days before."
    }
  ],
  images: [
    "/uploads/venues/banquet-hall-1.jpg",
    "/uploads/venues/banquet-hall-2.jpg",
    "/uploads/venues/banquet-hall-3.jpg"
  ],
  coverImage: "/uploads/venues/banquet-hall-cover.jpg",
  gallery: {
    photos: [
      "/uploads/venues/banquet-hall-1.jpg",
      "/uploads/venues/banquet-hall-2.jpg",
      "/uploads/venues/banquet-hall-3.jpg",
      "/uploads/venues/banquet-hall-4.jpg",
      "/uploads/venues/banquet-hall-5.jpg"
    ],
    videos: [
      "/uploads/videos/banquet-hall-tour.mp4"
    ]
  },
  galleryInfo: {
    photos: [
      "/uploads/venues/banquet-hall-1.jpg",
      "/uploads/venues/banquet-hall-2.jpg",
      "/uploads/venues/banquet-hall-3.jpg",
      "/uploads/venues/banquet-hall-4.jpg",
      "/uploads/venues/banquet-hall-5.jpg"
    ],
    videos: [
      "/uploads/videos/banquet-hall-tour.mp4"
    ]
  },
  videos: [
    "/uploads/videos/banquet-hall-tour.mp4"
  ],
  isFeatured: true,
  status: "approved",
  vendorActive: true,
  bookingButtonEnabled: true,
  leadsButtonEnabled: true,
  metaTitle: "Grand Royal Banquet Hall - Premium Wedding Venue in Jaipur",
  metaDescription: "Book Grand Royal Banquet Hall for your wedding, reception, or corporate event. Spacious hall accommodating up to 1000 guests with luxury amenities and professional services."
};

async function addBanquetHallVenue() {
  try {
    console.log('🚀 Starting Banquet Hall Venue Creation...\n');

    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Find or create Banquet Halls category
    console.log('📋 Finding Banquet Halls category...');
    let category = await Category.findOne({ 
      name: { $regex: /banquet hall/i } 
    });

    if (!category) {
      console.log('⚠️  Banquet Halls category not found. Creating new category...');
      category = await Category.create({
        name: "Banquet Halls",
        description: "Luxurious banquet halls and wedding venues for grand celebrations",
        icon: "banquet-icon",
        image: "/uploads/categories/banquet-hall.jpg",
        isActive: true,
        sortOrder: 1
      });
      console.log(`✅ Created category: ${category.name} (ID: ${category._id})\n`);
    } else {
      console.log(`✅ Found category: ${category.name} (ID: ${category._id})\n`);
    }

    // Find or create a vendor
    console.log('👤 Finding vendor...');
    let vendor = await User.findOne({ 
      role: 'vendor',
      isDeleted: { $ne: true },
      vendorStatus: { $ne: 'rejected' }
    });

    if (!vendor) {
      console.log('⚠️  No vendor found. Creating test vendor...');
      const hashedPassword = await bcrypt.hash("test123456", 10);
      vendor = await User.create({
        name: "Banquet Hall Owner",
        email: `banquetowner${Date.now()}@example.com`,
        password: hashedPassword,
        phone: "9876543210",
        role: "vendor",
        vendorStatus: "approved"
      });
      console.log(`✅ Created vendor: ${vendor.name} (ID: ${vendor._id})\n`);
    } else {
      console.log(`✅ Found vendor: ${vendor.name} (ID: ${vendor._id})\n`);
    }

    // Check if venue with same slug already exists
    const existingVenue = await Venue.findOne({ slug: banquetHallVenue.slug });
    if (existingVenue) {
      console.log(`⚠️  Venue with slug "${banquetHallVenue.slug}" already exists.`);
      console.log(`   Updating existing venue...\n`);
      
      // Update existing venue
      Object.assign(existingVenue, {
        ...banquetHallVenue,
        vendorId: vendor._id,
        categoryId: category._id
      });
      await existingVenue.save();
      
      console.log(`✅ Updated venue: ${existingVenue.name} (ID: ${existingVenue._id})\n`);
      console.log('📊 Venue Details:');
      console.log(`   Name: ${existingVenue.name}`);
      console.log(`   Category: ${category.name}`);
      console.log(`   Vendor: ${vendor.name}`);
      console.log(`   Capacity: ${existingVenue.capacity.minGuests} - ${existingVenue.capacity.maxGuests} guests`);
      console.log(`   Location: ${existingVenue.location.city}, ${existingVenue.location.state}`);
      console.log(`   Status: ${existingVenue.status}`);
      
      await mongoose.connection.close();
      console.log('\n✅ Process completed successfully!');
      return;
    }

    // Create venue
    console.log('🏢 Creating Banquet Hall venue...');
    const venue = await Venue.create({
      ...banquetHallVenue,
      vendorId: vendor._id,
      categoryId: category._id
    });

    console.log(`✅ Venue created successfully!\n`);
    console.log('📊 Venue Details:');
    console.log(`   ID: ${venue._id}`);
    console.log(`   Name: ${venue.name}`);
    console.log(`   Slug: ${venue.slug}`);
    console.log(`   Category: ${category.name}`);
    console.log(`   Vendor: ${vendor.name}`);
    console.log(`   Capacity: ${venue.capacity.minGuests} - ${venue.capacity.maxGuests} guests`);
    console.log(`   Location: ${venue.location.city}, ${venue.location.state}`);
    console.log(`   Price: ₹${venue.price}`);
    console.log(`   Veg Per Plate: ₹${venue.pricingInfo.vegPerPlate}`);
    console.log(`   Non-Veg Per Plate: ₹${venue.pricingInfo.nonVegPerPlate}`);
    console.log(`   Facilities: ${venue.facilities.length} items`);
    console.log(`   Amenities: ${venue.amenities.length} items`);
    console.log(`   Areas Available: ${venue.areasAvailable.length} areas`);
    console.log(`   Services: ${venue.services.length} services`);
    console.log(`   FAQ: ${venue.faq.length} questions`);
    console.log(`   Status: ${venue.status}`);
    console.log(`   Featured: ${venue.isFeatured ? 'Yes' : 'No'}`);

    await mongoose.connection.close();
    console.log('\n✅ Process completed successfully!');
    console.log('\n💡 You can now view this venue in the admin panel or customer portal.');

  } catch (error) {
    console.error('\n❌ Error creating Banquet Hall venue:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
addBanquetHallVenue();

