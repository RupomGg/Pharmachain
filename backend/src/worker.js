import { Worker } from 'bullmq';
import { eventQueue, deadLetterQueue, connection } from './config/redis.js';
import { eventProcessor } from './services/eventProcessor.js';
import { startEventListener } from './services/eventListener.js';
import { connectDatabase } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Worker Process - Handles event processing from queue
 * 
 * This should be run as a separate process from the API server
 * for better scalability and fault isolation
 */

console.log('\n🔧 Starting PharmaChain Worker...\n');

// ============ Event Processing Worker ============

const eventWorker = new Worker('event-processing', async (job) => {
  console.log(`\n📝 Processing job ${job.id}...`);
  
  try {
    const result = await eventProcessor.processEvent(job.data);
    
    if (result.skipped) {
      console.log(`⏭️  Job ${job.id} skipped: ${result.reason}`);
    } else {
      console.log(`✅ Job ${job.id} completed`);
    }
    
    return result;

  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error.message);
    throw error;
  }
}, {
  connection,
  concurrency: 5, // Process 5 events concurrently
  limiter: {
    max: 10,      // Max 10 jobs
    duration: 1000 // per second
  }
});

// Worker event handlers
eventWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

eventWorker.on('failed', async (job, err) => {
  console.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
  
  // If all retries exhausted, it's already in DLQ via eventProcessor
  if (job.attemptsMade >= 3) {
    console.log(`⚠️  Job ${job.id} moved to Dead Letter Queue`);
  }
});

eventWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

// ============ Dead Letter Queue Worker ============

const dlqWorker = new Worker('dead-letter-queue', async (job) => {
  console.error('\n⚠️  DEAD LETTER QUEUE - Manual review required');
  console.error('Event:', job.data.eventName);
  console.error('Batch ID:', job.data.args?.batchId);
  console.error('Error:', job.data.error);
  console.error('Failed at:', job.data.failedAt);
  
  // In production, send alert to admin via email/Slack
  // await sendAdminAlert(job.data);
  
  return { reviewed: false };
}, {
  connection
});

// ============ Startup ============

async function start() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    console.log('✅ Worker connected to MongoDB');
    console.log('✅ Worker connected to Redis');
    console.log('👷 Processing events with concurrency: 5\n');

    // Start blockchain event listener
    await startEventListener();

  } catch (error) {
    console.error('❌ Failed to start worker:', error.message);
    process.exit(1);
  }
}

// ============ Graceful Shutdown ============

process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down worker...');
  await eventWorker.close();
  await dlqWorker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Shutting down worker...');
  await eventWorker.close();
  await dlqWorker.close();
  await connection.quit();
  process.exit(0);
});

// Start the worker
start();
