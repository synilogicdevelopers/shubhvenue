import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import VendorCategory from './src/models/VendorCategory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Sample vendor categories
const categories = [
  {
    name: 'Wedding Venues',
    description: 'Beautiful wedding venues for your special day',
    isActive: true
  },
  {
    name: 'Catering Services',
    description: 'Professional catering services for events',
    isActive: true
  },
  {
    name: 'Photography',
    description: 'Wedding and event photography services',
    isActive: true
  },
  {
    name: 'Videography',
    description: 'Professional video recording and editing services',
    isActive: true
  },
  {
    name: 'Decoration',
    description: 'Event decoration and floral arrangements',
    isActive: true
  },
  {
    name: 'Music & DJ',
    description: 'DJ services and live music for events',
    isActive: true
  },
  {
    name: 'Makeup & Beauty',
    description: 'Bridal makeup and beauty services',
    isActive: true
  },
  {
    name: 'Transportation',
    description: 'Wedding cars and transportation services',
    isActive: true
  },
  {
    name: 'Invitation Cards',
    description: 'Custom wedding invitation cards and printing',
    isActive: true
  },
  {
    name: 'Event Planning',
    description: 'Complete event planning and coordination services',
    isActive: true
  }
];

async function addVendorCategories() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shubhvenue';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check existing categories
    const existingCategories = await VendorCategory.find({});
    console.log(`\n📊 Existing categories: ${existingCategories.length}`);

    // Add categories
    let added = 0;
    let skipped = 0;

    for (const categoryData of categories) {
      try {
        // Check if category already exists
        const exists = await VendorCategory.findOne({ 
          name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') } 
        });

        if (exists) {
          console.log(`⏭️  Skipped: "${categoryData.name}" (already exists)`);
          skipped++;
        } else {
          const category = new VendorCategory(categoryData);
          await category.save();
          console.log(`✅ Added: "${categoryData.name}"`);
          added++;
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  Skipped: "${categoryData.name}" (duplicate)`);
          skipped++;
        } else {
          console.error(`❌ Error adding "${categoryData.name}":`, error.message);
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Added: ${added}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total categories now: ${await VendorCategory.countDocuments()}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
addVendorCategories();
