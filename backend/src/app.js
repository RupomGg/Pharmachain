import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { verifyConnection } from './config/blockchain.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import batchesRouter from './routes/batches.js';
import traceRouter from './routes/trace.js';
import metadataRouter from './routes/metadata.js';
import eventsRouter from './routes/events.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import ordersRouter from './routes/orders.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============ Middleware ============

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (apply to all routes)
app.use('/api/', generalLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============ Routes ============

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/batches', batchesRouter);
app.use('/api/trace', traceRouter);
app.use('/api/metadata', metadataRouter);
app.use('/api/events', eventsRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/orders', ordersRouter);

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'PharmaChain Indexer API',
    version: '1.0.0',
    endpoints: {
      batches: '/api/batches',
      trace: '/api/trace/:batchId',
      metadata: '/api/metadata/validate',
      events: '/api/events'
    },
    documentation: '/api/docs'
  });
});

// ============ Error Handling ============

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============ Server Startup ============

async function startServer() {
  try {
    console.log('\n[API] Starting PharmaChain Backend API...\n');

    // Connect to MongoDB
    await connectDatabase();

    // Verify blockchain connection
    await verifyConnection();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n[API] Server running on http://localhost:${PORT}`);
      console.log(`[API] Health check: http://localhost:${PORT}/health`);
      console.log(`[API] API info: http://localhost:${PORT}/api\n`);
    });

  } catch (error) {
    console.error('[ERROR] Failed to start server:', error.message);
    process.exit(1);
  }
}

// ============ Graceful Shutdown ============

process.on('SIGINT', async () => {
  console.log('\n[API] Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[API] Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;
// Force restart for re-sync
