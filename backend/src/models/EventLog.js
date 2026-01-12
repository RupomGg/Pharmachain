import mongoose from 'mongoose';

/**
 * EventLog Schema - Ensures Idempotency
 * 
 * Purpose: Prevent processing the same blockchain event twice
 * 
 * Unique Index: { transactionHash: 1, logIndex: 1 }
 * This ensures we never process the same event multiple times
 */
const eventLogSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    description: 'Format: ${transactionHash}-${logIndex}'
  },
  eventName: {
    type: String,
    required: true,
    enum: [
      'BatchCreated',
      'BatchSplit',
      'TransferInitiated',
      'Transfer',
      'StatusUpdate',
      'MetadataAdded',
      'BatchRecalled',
      'BatchTransfer', // Added
      'BulkBatchCreated'
    ],
    index: true
  },
  batchId: {
    type: Number,
    required: true,
    index: true
  },
  blockNumber: {
    type: Number,
    required: true,
    index: true
  },
  transactionHash: {
    type: String,
    required: true,
    index: true
  },
  logIndex: {
    type: Number,
    required: true
  },
  args: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    description: 'Event arguments from blockchain'
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['PROCESSED', 'FAILED', 'RETRY'],
    default: 'PROCESSED'
  },
  error: {
    type: String,
    description: 'Error message if processing failed'
  }
}, {
  _id: false,
  timestamps: false
});

// Unique compound index to prevent duplicate event processing
eventLogSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });

// Index for querying events by batch
eventLogSchema.index({ batchId: 1, processedAt: -1 });

// Index for querying by block number (for sync recovery)
eventLogSchema.index({ blockNumber: 1 });

export const EventLog = mongoose.model('EventLog', eventLogSchema);
