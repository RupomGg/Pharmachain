import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  // 1. Identity
  batchId: { type: Number, required: true, index: true }, // Blockchain ID
  batchNumber: { type: String, required: true, index: true, unique: true }, // Internal (BN-101)
  manufacturer: { type: String, required: true, lowercase: true, index: true },
  owner: { type: String, required: true, lowercase: true, index: true }, // Changes on transfer
  parentBatchId: { type: Number, index: true, default: 0 }, // For lineage tracking

  // 2. Inventory (Dynamic - The Source of Truth)
  quantity: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['CREATED', 'IN_TRANSIT', 'SOLD', 'RECALLED', 'DELIVERED'], default: 'CREATED' },

  // 3. Product Details (Cached from Input for Search Speed)
  productName: { type: String, required: true, index: true },
  dosageStrength: String,
  packingType: { type: String, default: 'Box' }, // The Unit (e.g., Box)
  baseUnit: { type: String, default: 'Unit' },   // The Lowest Item (e.g., Capsule)
  packComposition: { type: String },             // Visual (e.g., "5 Strips x 10 Caps")
  totalUnitsPerPack: { type: Number, default: 1 }, // Math (e.g., 50)
  expiryDate: { type: Date, required: true, index: true },
  productImage: String, // URL
  ingredients: String,
  storageTemp: String,
  
  // 4. Financials (PRIVATE - Never on IPFS)
  financials: {
    baseUnitCost: Number, // $0.05
    baseUnitPrice: Number, // $0.10
    currency: { type: String, default: 'USD' }
  },

  // 5. Blockchain Link
  ipfsHash: { type: String, required: true }, // Points to static data
  txHash: String,
  blockNumber: Number,
  
  // 6. Lineage (Optional but good to keep from old schema if needed, but "The Fix" suggests clean schema. I will stick to "The New Schema" provided in the prompt strictly, plus minimal required fields for mongoose/app if any.)
  // The user prompt explicitly provided "The New Schema". I will implement exactly that.
  
}, { timestamps: true });

export const Batch = mongoose.model('Batch', BatchSchema);

