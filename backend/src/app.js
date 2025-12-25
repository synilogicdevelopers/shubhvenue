import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy - required when behind a reverse proxy (nginx, load balancer, etc.)
app.set('trust proxy', true);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000, // Increased to 300 requests per minute for development
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for auth routes (they have their own limiter)
  skip: (req) => {
    return req.path.startsWith('/api/auth') || req.path === '/api/auth';
  }
});

// Configure CORS
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'],
};

app.use(cors(corsOptions));

// Configure Helmet to allow images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// We need raw body for microservice callback signature verification,
// so capture it on all JSON requests.
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(limiter);

// Serve static files from uploads directory with CORS headers
// Serve at both /uploads and /api/uploads for compatibility
const staticOptions = {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }
};

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'wedding-venue-backend', uptime: process.uptime() });
});

app.use('/api', routes);

// 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

export default app;


