import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToDatabase } from '../config/db.js';
import Venue from '../models/Venue.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

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
        console.log(`  ✓ Deleted image: ${filename}`);
      }
    }
  } catch (error) {
    console.error(`  ✗ Error deleting image ${imagePath}:`, error.message);
  }
};

// Helper function to delete multiple gallery images
const deleteGalleryFiles = (galleryPaths) => {
  if (!galleryPaths || !Array.isArray(galleryPaths)) return;
  
  galleryPaths.forEach((galleryPath) => {
    if (typeof galleryPath === 'string') {
      deleteImageFile(galleryPath);
    } else if (galleryPath && typeof galleryPath === 'object') {
      // Handle gallery object with photos/videos
      if (galleryPath.photos && Array.isArray(galleryPath.photos)) {
        galleryPath.photos.forEach(deleteImageFile);
      }
      if (galleryPath.videos && Array.isArray(galleryPath.videos)) {
        galleryPath.videos.forEach(deleteImageFile);
      }
    }
  });
};

async function deleteAllVenues() {
  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Count total venues before deletion
    const totalVenues = await Venue.countDocuments({});
    console.log(`📊 Total venues found: ${totalVenues}`);

    if (totalVenues === 0) {
      console.log('ℹ️  No venues to delete. Database is already empty.');
      process.exit(0);
    }

    // Get all venues to delete associated files
    const venues = await Venue.find({});
    console.log(`\n🗑️  Starting deletion process...\n`);

    let deletedFilesCount = 0;

    // Delete associated image files for each venue
    for (const venue of venues) {
      if (venue.image) {
        deleteImageFile(venue.image);
        deletedFilesCount++;
      }
      if (venue.coverImage) {
        deleteImageFile(venue.coverImage);
        deletedFilesCount++;
      }
      if (venue.images && Array.isArray(venue.images)) {
        venue.images.forEach((img) => {
          deleteImageFile(img);
          deletedFilesCount++;
        });
      }
      if (venue.gallery) {
        deleteGalleryFiles(venue.gallery);
        if (Array.isArray(venue.gallery)) {
          deletedFilesCount += venue.gallery.length;
        }
      }
      if (venue.galleryInfo) {
        if (venue.galleryInfo.photos && Array.isArray(venue.galleryInfo.photos)) {
          venue.galleryInfo.photos.forEach((img) => {
            deleteImageFile(img);
            deletedFilesCount++;
          });
        }
        if (venue.galleryInfo.videos && Array.isArray(venue.galleryInfo.videos)) {
          venue.galleryInfo.videos.forEach((vid) => {
            deleteImageFile(vid);
            deletedFilesCount++;
          });
        }
      }
      if (venue.videos && Array.isArray(venue.videos)) {
        venue.videos.forEach((vid) => {
          deleteImageFile(vid);
          deletedFilesCount++;
        });
      }
    }

    // Delete all venues from database
    const result = await Venue.deleteMany({});

    console.log(`\n✅ Successfully deleted ${result.deletedCount} venue(s) from database`);
    if (deletedFilesCount > 0) {
      console.log(`✅ Processed ${deletedFilesCount} associated image/video file(s)`);
    }
    console.log('\n🎉 All venues have been removed from the backend!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting venues:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
deleteAllVenues();

