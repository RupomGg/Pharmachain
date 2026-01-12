import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

/**
 * Redis Connection
 */
const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // Required for BullMQ
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

connection.on('connect', () => {
  console.log('✅ Redis connected');
});

connection.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

/**
 * Event Processing Queue
 * 
 * Handles blockchain events with retry logic
 */
export const eventQueue = new Queue('event-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500      // Keep last 500 failed jobs for debugging
  }
});

/**
 * Dead Letter Queue
 * 
 * Stores events that failed after all retry attempts
 */
export const deadLetterQueue = new Queue('dead-letter-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: false, // Never remove from DLQ
    removeOnFail: false
  }
});

/**
 * Alert Processing Queue
 * 
 * Handles email/SMS notifications
 */
export const alertQueue = new Queue('alert-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [eventCounts, dlqCounts, alertCounts] = await Promise.all([
    eventQueue.getJobCounts(),
    deadLetterQueue.getJobCounts(),
    alertQueue.getJobCounts()
  ]);

  return {
    eventQueue: eventCounts,
    deadLetterQueue: dlqCounts,
    alertQueue: alertCounts
  };
}

/**
 * Graceful shutdown
 */
export async function closeQueues() {
  await Promise.all([
    eventQueue.close(),
    deadLetterQueue.close(),
    alertQueue.close(),
    connection.quit()
  ]);
  console.log('Queues and Redis connection closed');
}

export { connection };
