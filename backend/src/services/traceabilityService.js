import mongoose from 'mongoose';
import { Batch } from '../models/Batch.js';
import { User } from '../models/User.js';
import { EventLog } from '../models/EventLog.js';

/**
 * Traceability Service - Supply Chain Lineage Queries
 * 
 * Features:
 * - Upstream lineage (all parents)
 * - Downstream distribution (all children)
 * - Full trace (combined)
 * - Circular dependency protection (maxDepth: 50)
 */

/**
 * Get upstream lineage (all parent batches)
 * 
 * Uses MongoDB $graphLookup to traverse parent relationships
 * 
 * @param {number} batchId - Starting batch ID
 * @returns {Promise<Object>} Batch with ancestors array
 */
export async function getUpstreamLineage(batchId) {
  // Ensure we query by ObjectId for aggregation matches
  const matchId = mongoose.Types.ObjectId.isValid(batchId) 
      ? new mongoose.Types.ObjectId(batchId) 
      : batchId; // Fallback if number (though likely ObjectId now)

  const result = await Batch.aggregate([
    { $match: { _id: matchId } },
    {
      $graphLookup: {
        from: 'batches',
        startWith: '$parentBatchId',
        connectFromField: 'parentBatchId',
        connectToField: 'batchId',
        as: 'ancestors',
        maxDepth: 50, // Prevent infinite loops
        depthField: 'depth',
        restrictSearchWithMatch: {
          parentBatchId: { $ne: 0 } // Stop at root batches
        }
      }
    },
    {
      $project: {
        batch: '$$ROOT',
        ancestors: {
          $map: {
            input: '$ancestors',
            as: 'ancestor',
            in: {
              batchId: '$$ancestor._id',
              parentBatchId: '$$ancestor.parentBatchId',
              quantity: '$$ancestor.quantity',
              unit: '$$ancestor.unit',
              owner: '$$ancestor.owner',
              manufacturer: '$$ancestor.manufacturer',
              status: '$$ancestor.status',
              depth: '$$ancestor.depth',
              createdAt: '$$ancestor.createdAt'
            }
          }
        }
      }
    }
  ]);

  return result[0] || { batch: null, ancestors: [] };
}

/**
 * Get downstream distribution (all child batches)
 * 
 * Uses MongoDB $graphLookup to traverse child relationships
 * 
 * @param {number} batchId - Starting batch ID
 * @returns {Promise<Object>} Batch with descendants array
 */
export async function getDownstreamDistribution(batchId) {
  const matchId = mongoose.Types.ObjectId.isValid(batchId) 
      ? new mongoose.Types.ObjectId(batchId) 
      : batchId;

  const result = await Batch.aggregate([
    { $match: { _id: matchId } },
    {
      $graphLookup: {
        from: 'batches',
        startWith: '$batchId',
        connectFromField: 'batchId',
        connectToField: 'parentBatchId',
        as: 'descendants',
        maxDepth: 50, // Circular dependency protection
        depthField: 'depth',
        restrictSearchWithMatch: {
          parentBatchId: { $ne: 0 } // Exclude root batches
        }
      }
    },
    {
      $project: {
        batch: '$$ROOT',
        descendants: {
          $map: {
            input: '$descendants',
            as: 'descendant',
            in: {
              batchId: '$$descendant._id',
              parentBatchId: '$$descendant.parentBatchId',
              quantity: '$$descendant.quantity',
              unit: '$$descendant.unit',
              owner: '$$descendant.owner',
              manufacturer: '$$descendant.manufacturer',
              status: '$$descendant.status',
              depth: '$$descendant.depth',
              createdAt: '$$descendant.createdAt',
              pendingTransfer: '$$descendant.pendingTransfer'
            }
          }
        }
      }
    }
  ]);

  return result[0] || { batch: null, descendants: [] };
}

/**
 * Get full trace (upstream + downstream)
 * 
 * @param {number} batchId - Batch ID to trace
 * @returns {Promise<Object>} Complete lineage
 */
export async function getFullTrace(batchId) {
  // Fetch batch details
  const batch = await Batch.findById(batchId).lean();
  
  if (!batch) {
    throw new Error(`Batch ${batchId} not found`);
  }

  // Fetch upstream and downstream in parallel
  const [upstreamResult, downstreamResult] = await Promise.all([
    getUpstreamLineage(batchId),
    getDownstreamDistribution(batchId)
  ]);

  const upstream = upstreamResult.ancestors || [];
  const downstream = downstreamResult.descendants || [];

  // --- Enrichment: Fetch Names & Missing Blockchain Data ---
  
  // 1. Fetch Manufacturer & Owner Names & Details
  const [manufacturerUser, ownerUser] = await Promise.all([
      User.findOne({ walletAddress: batch.manufacturer.toLowerCase() }).select('name email physicalAddress').lean(),
      User.findOne({ walletAddress: batch.owner.toLowerCase() }).select('name email physicalAddress').lean()
  ]);

  const manufacturerDetails = manufacturerUser || { name: 'Unknown', email: 'N/A', physicalAddress: 'N/A' };
  const ownerDetails = ownerUser || { name: 'Unknown', email: 'N/A', physicalAddress: 'N/A' };

  // 2. Fallback for TxHash if missing (Look in EventLogs)
  let txHash = batch.txHash;
  let blockNumber = batch.blockNumber;

  if (!txHash) {
      // Try to find the BatchCreated event
      const createEvent = await EventLog.findOne({ 
          eventName: 'BatchCreated', 
          'args.batchId': batch.batchId.toString() 
      }).select('transactionHash blockNumber').lean();

      if (createEvent) {
          txHash = createEvent.transactionHash;
          blockNumber = createEvent.blockNumber;
      }
  }

  // Check for depth warnings
  const maxUpstreamDepth = upstream.reduce((max, b) => Math.max(max, b.depth || 0), 0);
  const maxDownstreamDepth = downstream.reduce((max, b) => Math.max(max, b.depth || 0), 0);

  const warnings = [];
  if (maxUpstreamDepth >= 50) {
    warnings.push('Upstream lineage reached maximum depth (50). Possible circular dependency.');
  }
  if (maxDownstreamDepth >= 50) {
    warnings.push('Downstream distribution reached maximum depth (50). Possible circular dependency.');
  }

  return {
    batch: {
      batchId: batch._id,
      batchNumber: batch.batchNumber, // Added
      productName: batch.productName, // Added
      parentBatchId: batch.parentBatchId,
      quantity: batch.quantity,
      unit: batch.unit, // Note: Schema uses 'packingType'/'baseUnit', check if 'unit' exists on schema found earlier. 
      // Schema has: packingType, baseUnit. It does NOT have 'unit'. 
      // Existing code used 'unit', which might be undefined if not in schema.
      // I will add correct schema fields and keep 'unit' just in case it was a virtual or legacy.
      packingType: batch.packingType,
      baseUnit: batch.baseUnit,
      expiryDate: batch.expiryDate,
      owner: batch.owner,
      manufacturer: batch.manufacturer,
      status: batch.status,
      pendingTransfer: batch.pendingTransfer,
      metadata: batch.metadata,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      // Extended fields
      txHash: txHash,
      blockNumber: blockNumber,
      manufacturer: manufacturerDetails, // Return full object
      owner: ownerDetails, // Return full object
      ownerAddress: batch.owner, // Keep original address field for reference
      manufacturerAddress: batch.manufacturer, // Keep original address field for reference
      dosageStrength: batch.dosageStrength,
      productImage: batch.productImage,
      ingredients: batch.ingredients,
      storageTemp: batch.storageTemp
    },
    upstream: {
      count: upstream.length,
      maxDepth: maxUpstreamDepth,
      batches: upstream.sort((a, b) => (b.depth || 0) - (a.depth || 0)) // Sort by depth (deepest first)
    },
    downstream: {
      count: downstream.length,
      maxDepth: maxDownstreamDepth,
      batches: downstream.sort((a, b) => (a.depth || 0) - (b.depth || 0)) // Sort by depth (shallowest first)
    },
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Get batches by owner
 * 
 * @param {string} ownerAddress - Owner's Ethereum address
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of batches
 */
export async function getBatchesByOwner(ownerAddress, options = {}) {
  const {
    status,
    page = 1,
    limit = 20
  } = options;

  const query = { owner: ownerAddress.toLowerCase() };
  
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [batches, total] = await Promise.all([
    Batch.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Batch.countDocuments(query)
  ]);

  return {
    batches,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function searchBatches(query) {
  if (!query) return [];

  // 1. Precise Search: Batch Number (Case-insensitive)
  const preciseMatch = await Batch.findOne({ 
    batchNumber: { $regex: new RegExp(`^${query}$`, 'i') } 
  }).lean();

  if (preciseMatch) {
    return [preciseMatch]; // Return as array for consistency
  }

  // 2. Fuzzy Search: Product Name (Case-insensitive)
  const fuzzyMatches = await Batch.find({
    productName: { $regex: new RegExp(query, 'i') }
  })
  .limit(20) // Limit results
  .sort({ createdAt: -1 })
  .lean();

  return fuzzyMatches;
}

export const traceabilityService = {
  getUpstreamLineage,
  getDownstreamDistribution,
  getFullTrace,
  getBatchesByOwner,
  searchBatches
};
