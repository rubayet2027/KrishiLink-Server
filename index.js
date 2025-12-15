import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Import routes
import cropRoutes from './routes/cropRoutes.js';
import interestRoutes from './routes/interestRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ===================
// MIDDLEWARE
// ===================

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://krishilink-56c13.web.app', // Firebase Hosting
    'https://krishilink-56c13.firebaseapp.com', // Firebase alternate domain
    'https://krishilink.vercel.app', // Production client URL
    /\.vercel\.app$/, // Allow all Vercel preview deployments
    /\.web\.app$/, // Allow all Firebase Hosting domains
    /\.firebaseapp\.com$/ // Allow all Firebase alternate domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ===================
// HEALTH CHECK
// ===================

/**
 * @route   GET /
 * @desc    API health check and welcome message
 * @access  Public
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to KrishiLink API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/health
 * @desc    Detailed health check endpoint
 * @access  Public
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'KrishiLink API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      crops: '/api/crops',
      interests: '/api/interests',
      users: '/api/users'
    }
  });
});

// ===================
// API ROUTES
// ===================

app.use('/api/crops', cropRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/users', userRoutes);

// ===================
// ERROR HANDLING
// ===================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===================
// SERVER START
// ===================

/**
 * Start the server after connecting to MongoDB
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════');
      console.log('    🌾 KrishiLink API Server Started 🌾');
      console.log('═══════════════════════════════════════════════');
      console.log(`   📍 Port: ${PORT}`);
      console.log(`   🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   🔗 URL: http://localhost:${PORT}`);
      console.log('═══════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
