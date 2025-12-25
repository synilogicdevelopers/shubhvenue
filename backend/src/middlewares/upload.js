import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directories if they don't exist
const venuesUploadsDir = path.join(__dirname, '../../uploads/venues');
const categoriesUploadsDir = path.join(__dirname, '../../uploads/categories');
const menusUploadsDir = path.join(__dirname, '../../uploads/menus');
const bannersUploadsDir = path.join(__dirname, '../../uploads/banners');
const videosUploadsDir = path.join(__dirname, '../../uploads/videos');
const staffUploadsDir = path.join(__dirname, '../../uploads/staff');
const vendorStaffUploadsDir = path.join(__dirname, '../../uploads/vendor-staff');
const vendorCategoryUploadsDir = path.join(__dirname, '../../uploads/vendor-categories');
if (!fs.existsSync(venuesUploadsDir)) {
  fs.mkdirSync(venuesUploadsDir, { recursive: true });
}
if (!fs.existsSync(categoriesUploadsDir)) {
  fs.mkdirSync(categoriesUploadsDir, { recursive: true });
}
if (!fs.existsSync(vendorCategoryUploadsDir)) {
  fs.mkdirSync(vendorCategoryUploadsDir, { recursive: true });
}
if (!fs.existsSync(menusUploadsDir)) {
  fs.mkdirSync(menusUploadsDir, { recursive: true });
}
if (!fs.existsSync(bannersUploadsDir)) {
  fs.mkdirSync(bannersUploadsDir, { recursive: true });
}
if (!fs.existsSync(videosUploadsDir)) {
  fs.mkdirSync(videosUploadsDir, { recursive: true });
}
if (!fs.existsSync(staffUploadsDir)) {
  fs.mkdirSync(staffUploadsDir, { recursive: true });
}
if (!fs.existsSync(vendorStaffUploadsDir)) {
  fs.mkdirSync(vendorStaffUploadsDir, { recursive: true });
}

// Configure storage for venues
const venueStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, venuesUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for categories
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, categoriesUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for vendor categories
const vendorCategoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vendorCategoryUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for menus
const menuStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, menusUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for banners
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannersUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
  }
};

// File filter - only videos
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|webm|ogg|mov|avi|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /video\//.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (mp4, webm, ogg, mov, avi, mkv) are allowed!'), false);
  }
};

// Configure multer for venues
const upload = multer({
  storage: venueStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for categories
const categoryUpload = multer({
  storage: categoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for vendor categories
const vendorCategoryUpload = multer({
  storage: vendorCategoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for menus
const menuUpload = multer({
  storage: menuStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for banners
const bannerUpload = multer({
  storage: bannerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for videos
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: videoFileFilter
});

// Middleware for single image upload
export const uploadSingle = upload.single('image');

// Middleware for multiple images upload
export const uploadMultiple = upload.array('gallery', 50); // Max 50 images

// Middleware for both single image and gallery
export const uploadVenueImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 50 }
]);

// Middleware for venue images and videos
export const uploadVenueMedia = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Route to appropriate directory based on file type
      if (file.mimetype.startsWith('video/')) {
        cb(null, videosUploadsDir);
      } else {
        cb(null, venuesUploadsDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (for videos)
  },
  fileFilter: (req, file, cb) => {
    // Allow both images and videos
    if (file.mimetype.startsWith('image/')) {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      if (extname) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
      }
    } else if (file.mimetype.startsWith('video/')) {
      const allowedTypes = /mp4|webm|ogg|mov|avi|mkv/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      if (extname) {
        cb(null, true);
      } else {
        cb(new Error('Only video files (mp4, webm, ogg, mov, avi, mkv) are allowed!'), false);
      }
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 50 },
  { name: 'videos', maxCount: 5 } // Max 5 videos
]);

// Middleware for category image upload
export const uploadCategoryImage = categoryUpload.single('image');

// Middleware for vendor category image upload
export const uploadVendorCategoryImage = vendorCategoryUpload.single('image');

// Middleware for menu image upload
export const uploadMenuImage = menuUpload.single('image');

// Middleware for banner image upload
export const uploadBannerImage = bannerUpload.single('image');

// Middleware for video upload
export const uploadVideo = videoUpload.single('video');

// Configure storage for staff images
const staffStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, staffUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Configure multer for staff images
const staffUpload = multer({
  storage: staffStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for staff image upload
export const uploadStaffImage = staffUpload.single('img');

// Configure storage for vendor staff
const vendorStaffStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vendorStaffUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Configure multer for vendor staff images
const vendorStaffUpload = multer({
  storage: vendorStaffStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for vendor staff image upload
export const uploadVendorStaffImage = vendorStaffUpload.single('img');

// Error handling wrapper for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 50 gallery images allowed.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

