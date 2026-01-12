import mongoose from 'mongoose';

/**
 * AlertQueue Schema - Batch Processing for Notifications
 * 
 * Purpose: Queue alerts for email/SMS notifications
 * Used primarily for cascading recall alerts
 */
const alertQueueSchema = new mongoose.Schema({
  batchId: {
    type: Number,
    required: true,
    index: true
  },
  alertType: {
    type: String,
    required: true,
    enum: ['RECALL', 'TRANSFER_PENDING', 'TRANSFER_ACCEPTED', 'BATCH_SPLIT'],
    index: true
  },
  recipient: {
    type: String,
    required: true,
    lowercase: true,
    description: 'Ethereum address or email/phone for notification'
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  attempts: {
    type: Number,
    default: 0,
    description: 'Number of send attempts'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  sentAt: {
    type: Date
  },
  error: {
    type: String,
    description: 'Error message if sending failed'
  }
});

// Index for processing pending alerts
alertQueueSchema.index({ status: 1, createdAt: 1 });

// Index for retry logic
alertQueueSchema.index({ status: 1, attempts: 1 });

export const AlertQueue = mongoose.model('AlertQueue', alertQueueSchema);
