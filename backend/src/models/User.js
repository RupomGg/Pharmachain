import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  physicalAddress: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  taxId: {
    type: String // Legacy field, keeping for backward compatibility
  },
  role: {
    type: String,
    enum: ['GUEST', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'PATIENT', 'ADMIN'],
    default: 'GUEST'
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  requestedRole: {
    type: String,
    enum: ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'PATIENT'],
    required: false
  },
  identityHash: {
    type: String,
    // This is the keccak256 hash of PII, generated server-side
    // Used for on-chain identity verification
  },
  isRegisteredOnChain: {
    type: Boolean,
    default: false
  },
  nonce: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
