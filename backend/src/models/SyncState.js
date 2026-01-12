import mongoose from 'mongoose';

/**
 * SyncState Schema - Track Last Processed Block
 * 
 * Purpose: Enable missed event recovery on server restart
 * 
 * Single document with _id: "pharmachain-sync"
 */
const syncStateSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    default: 'pharmachain-sync'
  },
  lastProcessedBlock: {
    type: Number,
    required: true,
    default: 0,
    description: 'Last block number that was successfully processed'
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  contractAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  chainId: {
    type: Number,
    required: true
  },
  isSync: {
    type: Boolean,
    default: false,
    description: 'True if currently syncing missed blocks'
  }
}, {
  _id: false,
  timestamps: false
});

export const SyncState = mongoose.model('SyncState', syncStateSchema);
