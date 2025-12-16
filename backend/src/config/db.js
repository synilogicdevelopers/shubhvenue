import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase() {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  
  // Don't connect if password placeholder exists
  if (uri.includes('<db_password>')) {
    throw new Error('MongoDB password not configured. Please update MONGODB_URI in .env');
  }
  
  mongoose.set('strictQuery', true);
  
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 3000, // 3 seconds to select server (reduced from 5)
      socketTimeoutMS: 8000, // 8 seconds for socket operations (reduced from 10)
      connectTimeoutMS: 5000, // 5 seconds to establish connection (reduced from 10)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
      retryWrites: true,
      retryReads: true,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

// Export connection status check
export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}


