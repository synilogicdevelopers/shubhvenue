import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './src/app.js';
import { connectToDatabase } from './src/config/db.js';

const port = process.env.PORT || 8030;
const server = http.createServer(app);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(maxRetries = 10, backoffMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connectToDatabase();
      console.log('Database connection established.');
      return;
    } catch (err) {
      console.error(`Database connection failed (attempt ${attempt}/${maxRetries}):`, err.message || err);
      if (attempt < maxRetries) {
        await delay(backoffMs);
      }
    }
  }
  console.error('Database connection could not be established after retries. API will continue to run without DB.');
}

function start() {
  const host = '0.0.0.0'; // Listen on all network interfaces
  server.listen(port, host, () => {
    console.log(`API server listening on port ${port}`);
    console.log(`Local: http://localhost:${port}`);
    console.log(`Network: http://192.168.29.20:${port}`);
    console.log(`Access from other devices on your network using: http://192.168.29.20:${port}`);
  });
  // Try to connect to DB in background with retries
  connectWithRetry().catch(() => {
    // Already logged inside connectWithRetry
  });
}

start();


