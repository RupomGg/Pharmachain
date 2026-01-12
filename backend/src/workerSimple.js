import { startEventListener } from './services/eventListener.js';
import { connectDatabase } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Simplified Worker - Direct Event Processing (No Redis/BullMQ)
 * 
 * This version processes blockchain events directly without queuing
 */

console.log('\n[WORKER] Starting PharmaChain Worker (Simplified)...\n');

async function start() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    console.log('[WORKER] Connected to MongoDB\n');

    // Start blockchain event listener (processes events directly)
    await startEventListener();

  } catch (error) {
    console.error('[ERROR] Failed to start worker:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[WORKER] Shutting down worker...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[WORKER] Shutting down worker...');
  process.exit(0);
});

// Start the worker
start();
