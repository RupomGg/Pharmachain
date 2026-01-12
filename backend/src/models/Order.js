import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  distributor: {
    type: String, // Address
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  manufacturer: {
    type: String, // Address
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  batchId: {
    type: Number,
    required: true
  },
  productName: {
    type: String, // Helper for UI
    required: true
  },
  quantityRequested: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  txHash: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Order = mongoose.model('Order', orderSchema);
