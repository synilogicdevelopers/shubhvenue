import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import cron from 'node-cron';
import app from './src/app.js';
import { connectToDatabase } from './src/config/db.js';

const port = process.env.PORT || 8030;
const server = http.createServer(app);

// Increase server timeout for large file uploads (videos can be large)
// Default is 2 minutes, increase to 5 minutes for video uploads
server.timeout = 300000; // 5 minutes in milliseconds
server.keepAliveTimeout = 65000; // Keep connections alive longer
server.headersTimeout = 66000; // Headers timeout slightly longer than keepAlive

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

// Setup monthly revenue email cron job
// Runs on 1st day of every month at 9:00 AM
function setupMonthlyRevenueCron() {
  // Cron expression: '0 9 1 * *' means:
  // - 0 minutes
  // - 9 hours (9 AM)
  // - 1 day of month (1st day)
  // - * any month
  // - * any day of week
  cron.schedule('0 9 1 * *', async () => {
    console.log('📧 Monthly revenue email cron job triggered');
    try {
      const { sendMonthlyRevenueEmails } = await import('./src/utils/monthlyRevenueEmail.js');
      await sendMonthlyRevenueEmails();
    } catch (error) {
      console.error('❌ Error in monthly revenue email cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  
  console.log('✅ Monthly revenue email cron job scheduled (runs on 1st of every month at 9:00 AM IST)');
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
  connectWithRetry().then(() => {
    // Setup cron jobs after database connection is established
    setupMonthlyRevenueCron();
  }).catch(() => {
    // Already logged inside connectWithRetry
    // Still setup cron jobs even if DB connection fails initially
    setupMonthlyRevenueCron();
  });
}

start();


