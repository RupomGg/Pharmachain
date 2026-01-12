import { Batch } from '../models/Batch.js';
import { AlertQueue } from '../models/AlertQueue.js';
import { traceabilityService } from './traceabilityService.js';
import { notificationService } from './notificationService.js';

/**
 * Recall Service - Cascading Recall System
 * 
 * Features:
 * - Mark root batch as RECALLED
 * - Recursive downstream batch lookup
 * - Create alerts for affected batches
 * - Mock email/SMS notifications
 */

/**
 * Handle recall event from blockchain
 * 
 * @param {number} batchId - Batch ID to recall
 * @param {string} reason - Reason for recall
 * @returns {Promise<Object>} Recall result
 */
export async function handleRecallEvent(batchId, reason = 'Quality control issue') {
  console.log(`[RECALL] Processing recall for Batch #${batchId}`);

  // ============ Step 1: Mark root batch as RECALLED ============
  await Batch.findByIdAndUpdate(batchId, {
    status: 'RECALLED',
    updatedAt: new Date()
  });

  // ============ Step 2: Find all downstream batches ============
  const downstreamResult = await traceabilityService.getDownstreamDistribution(batchId);
  const allDescendants = downstreamResult.descendants || [];

  console.log(`[RECALL] Found ${allDescendants.length} downstream batches`);

  // ============ Step 3: Filter active batches (not already recalled, not with manufacturer) ============
  const activeBatches = allDescendants.filter(batch => 
    batch.status !== 'RECALLED' && 
    batch.owner !== batch.manufacturer
  );

  console.log(`⚠️  ${activeBatches.length} active batches need to be notified`);

  // ============ Step 4: Mark all downstream batches as RECALLED ============
  if (allDescendants.length > 0) {
    const descendantIds = allDescendants.map(b => b.batchId);
    await Batch.updateMany(
      { _id: { $in: descendantIds } },
      { 
        $set: { 
          status: 'RECALLED',
          updatedAt: new Date()
        }
      }
    );
  }

  // ============ Step 5: Create alert queue entries ============
  const alertPromises = activeBatches.map(batch => 
    AlertQueue.create({
      batchId: batch.batchId,
      alertType: 'RECALL',
      recipient: batch.owner,
      message: `URGENT RECALL: Batch #${batch.batchId} (derived from recalled Batch #${batchId}) must be quarantined immediately. Reason: ${reason}`,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date()
    })
  );

  await Promise.all(alertPromises);

  // ============ Step 6: Process alerts (mock notifications) ============
  const notificationResult = await notificationService.processAlerts();

  return {
    recalledBatch: batchId,
    reason,
    totalDescendants: allDescendants.length,
    affectedBatches: activeBatches.length,
    notificationsSent: notificationResult.sent,
    notificationsFailed: notificationResult.failed
  };
}

/**
 * Get recall impact analysis
 * 
 * @param {number} batchId - Batch ID to analyze
 * @returns {Promise<Object>} Impact analysis
 */
export async function getRecallImpact(batchId) {
  const batch = await Batch.findById(batchId);
  
  if (!batch) {
    throw new Error(`Batch ${batchId} not found`);
  }

  // Get all downstream batches
  const downstreamResult = await traceabilityService.getDownstreamDistribution(batchId);
  const descendants = downstreamResult.descendants || [];

  // Group by owner
  const byOwner = descendants.reduce((acc, batch) => {
    if (!acc[batch.owner]) {
      acc[batch.owner] = [];
    }
    acc[batch.owner].push(batch.batchId);
    return acc;
  }, {});

  // Group by status
  const byStatus = descendants.reduce((acc, batch) => {
    if (!acc[batch.status]) {
      acc[batch.status] = 0;
    }
    acc[batch.status]++;
    return acc;
  }, {});

  return {
    batchId,
    currentStatus: batch.status,
    totalDescendants: descendants.length,
    affectedOwners: Object.keys(byOwner).length,
    batchesByOwner: byOwner,
    batchesByStatus: byStatus,
    estimatedImpact: {
      totalQuantity: descendants.reduce((sum, b) => sum + b.quantity, batch.quantity),
      unit: batch.unit
    }
  };
}

export const recallService = {
  handleRecallEvent,
  getRecallImpact
};
