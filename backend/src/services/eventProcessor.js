import { Batch } from '../models/Batch.js';
import axios from 'axios';
import { EventLog } from '../models/EventLog.js';
// import { deadLetterQueue } from '../config/redis.js'; // Disabled to prevent connection errors
import { recallService } from './recallService.js';

/**
 * Event Processor - Process blockchain events with idempotency
 * 
 * Features:
 * - Idempotency check using EventLog
 * - Event-specific processing logic
 * - Error handling with Dead Letter Queue
 * - Retry mechanism
 */

/**
 * Main event processing function
 */
export async function processEvent(eventData) {
  const eventId = `${eventData.transactionHash}-${eventData.logIndex}`;
  
  // Destructure event data
  const { eventName, args, transactionHash, blockNumber, timestamp } = eventData;
  
  try {
    // ============ Idempotency Check ============
    const existing = await EventLog.findById(eventId);
    if (existing) {
      console.log(`[INFO] Event ${eventId} already processed, skipping`);
      return { skipped: true, reason: 'already_processed' };
    }

    console.log(`[PROCESSOR] Processing ${eventName} event (Batch #${args.batchId || 'N/A'})`);

    // ============ Process Based on Event Type ============
    let result;
    switch (eventName) {
      case 'BatchCreated':
        result = await handleBatchCreated(eventData);
        break;

      case 'MetadataAdded':
        const mBatchId = args.batchId.toString();
        const mIpfsHash = args.ipfsHash; 
        
        console.log(`[EventProcessor] Detected MetadataAdded for Batch ${mBatchId}`);
        result = await handleMetadataAdded(eventData);
        break;
      
      case 'BatchSplit':
        // Ignored in favor of BatchTransfer which has 'to' address
        break;
      
      case 'BatchTransfer':
        result = await handleBatchTransfer(eventData);
        break;

      case 'TransferInitiated':
        result = await handleTransferInitiated(eventData);
        break;
      
      case 'Transfer':
        // Legacy or ERC type transfer
        result = await handleTransferAccepted(eventData);
        break;
      
      case 'StatusUpdate':
        result = await handleStatusUpdate(eventData);
        break;
      
      case 'BatchRecalled':
        result = await handleBatchRecalled(eventData);
        break;
      
      case 'BulkBatchCreated':
        // Just log it, individual BatchCreated events will handle the actual creation
        console.log(`[INFO] Bulk batch created: ${args.count} batches starting from #${args.firstBatchId}`);
        result = { processed: true, bulkBatch: true };
        break;
      
      default:
        console.warn(`[WARN] Unknown event type: ${eventData.eventName}`);
        result = { processed: false };
    }

    // ============ Mark as Processed ============
    await EventLog.create({
      _id: eventId,
      eventName: eventData.eventName,
      batchId: eventData.args.batchId || 0,
      blockNumber: eventData.blockNumber,
      transactionHash: eventData.transactionHash,
      logIndex: eventData.logIndex,
      args: eventData.args,
      status: 'PROCESSED',
      processedAt: new Date()
    });

    console.log(`[PROCESSOR] Event ${eventId} processed successfully`);
    return { processed: true, result };

  } catch (error) {
    if (error.code === 11000) {
        console.warn(`[PROCESSOR] Ignored Duplicate Key Error (Race Condition): ${error.message}`);
        return { processed: true, duplicate: true };
    }

    console.error(`[ERROR] Error processing event ${eventId}:`, error.message);

    // ============ Push to Dead Letter Queue ============
    // await deadLetterQueue.add('failed-event', {
    //   ...eventData,
    //   error: error.message,
    //   failedAt: new Date()
    // });

    // Log the failure
    try {
      await EventLog.create({
        _id: eventId,
        eventName: eventData.eventName,
        batchId: eventData.args.batchId || 0,
        blockNumber: eventData.blockNumber,
        transactionHash: eventData.transactionHash,
        logIndex: eventData.logIndex,
        args: eventData.args,
        status: 'FAILED',
        error: error.message,
        processedAt: new Date()
      });
    } catch (logError) {
      if (logError.code === 11000) {
          console.warn(`[PROCESSOR] Failed to log error due to race condition (Duplicate Key): ${eventId}`);
      } else {
          console.error('Failed to log error:', logError.message);
      }
    }

    throw error;
  }
}

// ============ Event Handlers ============

/**
 * Handle BatchCreated event
 */
async function handleBatchCreated(eventData) {
  const { batchId, manufacturer, quantity, unit } = eventData.args;

  // Upsert: If batchId exists (from old chain run), overwrite it.
  // This handles development environment resets gracefully.

  // Upsert: Query by batchId (Number), NOT _id (ObjectId)
  await Batch.findOneAndUpdate(
    { batchId: Number(batchId) },
    {
      // ...
      batchNumber: `Pending-BN-${batchId}`, 
      productName: `Pending Batch #${batchId}`, 
      
      // Do NOT set _id manually. Let Mongoose handle it.
      batchId: Number(batchId),
      parentBatchId: 0,
      quantity: Number(quantity),
      unit: unit,
      owner: manufacturer.toLowerCase(),
      manufacturer: manufacturer.toLowerCase(),
      status: 'CREATED',
      metadataHistory: [],
      metadata: {},
      createdAt: new Date(eventData.timestamp * 1000 || Date.now()),
      updatedAt: new Date(eventData.timestamp * 1000 || Date.now()),
      expiryDate: new Date(Date.now() + 31536000000), 
      ipfsHash: 'pending', 
      blockNumber: eventData.blockNumber,
      transactionHash: eventData.transactionHash
    },
    { upsert: true, new: true }
  );


  return { batchId: Number(batchId), action: 'created' };
}

/**
 * Handle BatchSplit event
 */
/**
 * Handle BatchTransfer event (Split & Send)
 * Args: parentBatchId, newBatchId, from, to, quantity
 */
async function handleBatchTransfer(eventData) {
  const { parentBatchId, newBatchId, from, to, quantity } = eventData.args;

  console.log(`[PROCESSOR] Handling BatchTransfer: #${parentBatchId} -> #${newBatchId} (${quantity} units to ${to})`);

  // 1. Deduct from parent batch (if it exists and is not 0)
  if (Number(parentBatchId) !== 0) {
    const parentBatch = await Batch.findOne({ batchId: Number(parentBatchId) });
    if (parentBatch) {
      parentBatch.quantity -= Number(quantity);
      parentBatch.updatedAt = new Date();
      await parentBatch.save();
      console.log(`[PROCESSOR] Deducted ${quantity} from Batch #${parentBatchId}. New Qty: ${parentBatch.quantity}`);
    } else {
        console.warn(`[PROCESSOR] Parent Batch #${parentBatchId} not found for deduction.`);
    }
  }

  // 2. Create child batch (The new partial batch)
  // We need to fetch property details (unit, etc) from parent or use defaults
  let unit = 'Unit'; 
  let manufacturer = from;
  
  const parentBatch = await Batch.findOne({ batchId: Number(parentBatchId) });
  if (parentBatch) {
      unit = parentBatch.unit;
      manufacturer = parentBatch.manufacturer;
  }

  await Batch.create({
    // Do not set _id manually
    batchId: Number(newBatchId),
    batchNumber: `Distributor-BN-${newBatchId}`, // Auto-generate
    parentBatchId: Number(parentBatchId),
    quantity: Number(quantity),
    unit: unit,
    owner: to.toLowerCase(), // The Recipient
    manufacturer: manufacturer.toLowerCase(),
    status: 'CREATED',
    metadataHistory: [],
    metadata: parentBatch?.metadata || {}, // Inherit metadata
    ipfsHash: parentBatch?.ipfsHash || '', // Inherit IPFS hash (Critical fix)
    ipfsMetadataHash: parentBatch?.ipfsHash || '', // Also set alias
    // Inherit other fields potentially?
    productName: parentBatch?.productName,
    dosageStrength: parentBatch?.dosageStrength,
    expiryDate: parentBatch?.expiryDate,
    packingType: parentBatch?.packingType,
    baseUnitPrice: parentBatch?.baseUnitPrice,
    
    // Explicitly inherit all product details
    ingredients: parentBatch?.ingredients,
    storageTemp: parentBatch?.storageTemp,
    productImage: parentBatch?.productImage,
    packComposition: parentBatch?.packComposition,
    totalUnitsPerPack: parentBatch?.totalUnitsPerPack,
    baseUnit: parentBatch?.baseUnit,
    
    createdAt: new Date(eventData.timestamp * 1000 || Date.now()),
    updatedAt: new Date(eventData.timestamp * 1000 || Date.now()),
    blockNumber: eventData.blockNumber,
    transactionHash: eventData.transactionHash
  });

  return { parentBatchId: Number(parentBatchId), newBatchId: Number(newBatchId), to };
}

/**
 * Handle TransferInitiated event
 */
async function handleTransferInitiated(eventData) {
  const { batchId, from, to } = eventData.args;

  await Batch.findOneAndUpdate({ batchId: Number(batchId) }, {
    status: 'IN_TRANSIT',
    pendingTransfer: {
      to: to.toLowerCase(),
      initiatedAt: new Date(eventData.timestamp * 1000 || Date.now())
    },
    updatedAt: new Date()
  });

  return { batchId: Number(batchId), from, to };
}

/**
 * Handle Transfer (accepted) event
 */
async function handleTransferAccepted(eventData) {
  const { batchId, from, to } = eventData.args;

  await Batch.findOneAndUpdate({ batchId: Number(batchId) }, {
    owner: to.toLowerCase(),
    status: 'DELIVERED',
    pendingTransfer: null,
    updatedAt: new Date()
  });

  return { batchId: Number(batchId), newOwner: to };
}

/**
 * Handle StatusUpdate event
 */
async function handleStatusUpdate(eventData) {
  const { batchId, status } = eventData.args;

  // Map enum number to string
  const statusMap = ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'RECALLED'];
  const statusString = statusMap[Number(status)];

  await Batch.findOneAndUpdate({ batchId: Number(batchId) }, {
    status: statusString,
    updatedAt: new Date()
  });

  return { batchId: Number(batchId), status: statusString };
}

/**
 * Handle MetadataAdded event
 */
async function handleMetadataAdded(eventData) {
  // PharmaChainV2 MetadataAdded event: (batchId, ipfsHash, addedBy)
  const { batchId, ipfsHash: rawH, addedBy } = eventData.args;
  const ipfsHash = rawH ? rawH.trim() : '';

  console.log(`[PROCESSOR] MD Event - BatchId: ${batchId}, Hash: '${ipfsHash}'`);

  console.log(`[PROCESSOR] Adding IPFS hash ${ipfsHash} to batch #${batchId}`);

  let updateData = {
    ipfsHash: ipfsHash,
    ipfsMetadataHash: ipfsHash,
    updatedAt: new Date()
  };

  // CLEANUP: Check if a placeholder batch exists with this IPFS hash (created by Controller)
  if (ipfsHash && ipfsHash.length > 0) {
      const { Order } = await import('../models/Order.js'); 
      try {
        // 5. Data Migration & Cleanup
        // Find the API-created placeholder batch (batchId: 0) that matches this IPFS hash
        console.log(`[PROCESSOR] Looking for placeholder with batchId:0 and ipfsHash: '${ipfsHash}'`);
        
        const placeholder = await Batch.findOne({ 
          batchId: 0, 
          ipfsHash: ipfsHash 
        });

        if (!placeholder) {
            console.warn(`[PROCESSOR] ⚠️ No placeholder found for IPFS Hash: ${ipfsHash}`);
            // Extended debug: check if ANY batch 0 exists
            const anyDraft = await Batch.findOne({ batchId: 0 });
            if (anyDraft) {
                console.log(`[PROCESSOR] Debug: First available draft uses hash: ${anyDraft.ipfsHash}`);
            } else {
                console.log(`[PROCESSOR] Debug: No drafts (batchId:0) found in DB.`);
            }
        }

        if (placeholder) {
          console.log(`[EVENT] Found placeholder batch for merging: ${placeholder.batchNumber}`);
          
          // Capture data before deleting
          const pData = placeholder.toObject();

          // CRITICAL FIX: Delete the placeholder FIRST to free up the unique 'batchNumber'
          // Otherwise, updating the real batch to use this batchNumber throws E11000 Duplicate Key Error
          await Batch.deleteOne({ _id: placeholder._id });
          console.log(`[EVENT] Deleted placeholder ${placeholder._id} to free up batchNumber ${pData.batchNumber}`);

          // Now valid to update the real batch
          await Batch.findOneAndUpdate(
            { batchId: Number(batchId) },
            {
              $set: {
                 financials: pData.financials, 
                 productImage: pData.productImage,
                 ingredients: pData.ingredients,
                 storageTemp: pData.storageTemp,
                 dosageStrength: pData.dosageStrength,
                 packComposition: pData.packComposition,
                 totalUnitsPerPack: pData.totalUnitsPerPack,
                 packingType: pData.packingType,
                 baseUnit: pData.baseUnit,
                 
                 // Now we can safely take the batchNumber
                 batchNumber: pData.batchNumber
              }
            }
          );
          console.log(`[EVENT] Merged data from placeholder to Batch #${batchId}`);
          
          // ============ AUTO RELINK ORDERS ============
          if (pData.productName) {
              const relinkRes = await Order.updateMany(
                  { batchId: 0, productName: pData.productName },
                  { $set: { batchId: Number(batchId) } }
              );
              console.log(`[EVENT] Auto-Relinked ${relinkRes.modifiedCount} orders (Draft -> Batch #${batchId})`);
          }

        } else {
          // Fallback: If no placeholder (maybe deleted already?), check if we have lingering duplicates 
          // Just to be safe, delete any batchId:0 with this hash
          await Batch.deleteMany({ batchId: 0, ipfsHash: ipfsHash });
        }
      } catch (err) {
        console.warn(`[PROCESSOR] Cleanup warning: ${err.message}`);
      }
  }

  // Fetch metadata from IPFS with Retry Logic
  if (ipfsHash && ipfsHash.length > 0) {
    let retries = 5;
    let delay = 2000;
    let success = false;

    while (retries > 0 && !success) {
      try {
        console.log(`[PROCESSOR] Fetching metadata from IPFS: ${ipfsHash} (Attempt ${6 - retries})`);
        // Use a public gateway, or configurable one
        const gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
        const response = await axios.get(`${gateway}${ipfsHash}`, { timeout: 15000 });
        
        if (response.data) {
          const metadata = response.data;
          const props = metadata.properties || {};

          console.log(`[PROCESSOR] Metadata fetched successfully for batch #${batchId}`);

          // Map fields from JSON to Batch Schema
          const totalUnitsPerPack = props.totalUnitsPerPack ? Number(props.totalUnitsPerPack) : 1;
          const baseUnitPrice = props.baseUnitPrice ? Number(props.baseUnitPrice) : 0;
          const baseUnitCost = props.baseUnitCost ? Number(props.baseUnitCost) : 0;
          
          // Fetch current batch to get quantity for calculation
          const currentBatch = await Batch.findOne({ batchId: Number(batchId) });
          const quantity = currentBatch ? currentBatch.quantity : 0;
          
          const totalBatchValue = quantity * totalUnitsPerPack * baseUnitPrice;

          updateData = {
            ...updateData,
            productName: metadata.name || updateData.productName,
            dosageStrength: props.strength,
            expiryDate: props.expiry,
            packingType: props.packingType,
            ingredients: props.ingredients,
            storageTemp: props.storageTemp,
            packComposition: props.packComposition,
            totalUnitsPerPack: totalUnitsPerPack,
            productImage: metadata.image || props.productImage,
            
            baseUnitPrice: baseUnitPrice,
            baseUnitCost: baseUnitCost,
            totalBatchValue: totalBatchValue,
            
            metadata: {
              ...metadata,
              ipfsHash,
              docType: 'batch_metadata',
              category: 'general',
              addedBy: addedBy ? addedBy.toLowerCase() : null,
              addedAt: new Date(eventData.timestamp * 1000 || Date.now())
            }
          };
          success = true;
        }
      } catch (err) {
        // ... (error handling remains the same) ...
        const isRetryable = !err.response || err.response.status === 429 || err.response.status >= 500;
        
        if (isRetryable && retries > 1) {
             console.warn(`[PROCESSOR] IPFS Fetch failed for #${batchId}: ${err.message}. Retrying in ${delay/1000}s...`);
             await new Promise(resolve => setTimeout(resolve, delay));
             delay *= 2; // Exponential backoff: 2s, 4s, 8s, 16s...
             retries--;
        } else {
             console.error(`[PROCESSOR] Failed to fetch IPFS metadata for batch #${batchId} after retries: ${err.message}`);
             retries = 0; // Stop
        }
      }
    }
  }

  // Update batch with IPFS hash and metadata
  // Also push to history
  const historyEntry = {
      ipfsHash: ipfsHash,
      docType: 'batch_metadata',
      category: 'general',
      addedBy: addedBy ? addedBy.toLowerCase() : 'unknown',
      addedAt: new Date()
  };

  await Batch.findOneAndUpdate({ batchId: Number(batchId) }, {
    $set: updateData,
    $push: { metadataHistory: historyEntry }
  });

  return { batchId: Number(batchId), ipfsHash, metadataFetched: !!updateData.productName };
}

/**
 * Handle BatchRecalled event
 */
async function handleBatchRecalled(eventData) {
  const { batchId, recalledBy, reason } = eventData.args;

  // Update batch status
  await Batch.findOneAndUpdate({ batchId: Number(batchId) }, {
    status: 'RECALLED',
    updatedAt: new Date()
  });

  // Trigger cascading recall
  const recallResult = await recallService.handleRecallEvent(Number(batchId), reason);

  return { batchId: Number(batchId), ...recallResult };
}


/**
 * Process a specific transaction by hash
 */
async function processTransaction(txHash) {
    console.log(`[PROCESSOR] Force-processing transaction: ${txHash}`);
    const { getContract, getProvider } = await import('../config/blockchain.js');
    
    // 1. Get Block Number from Receipt
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
        throw new Error("Transaction not found on chain (pending or invalid hash)");
    }

    const blockNumber = receipt.blockNumber;
    console.log(`[PROCESSOR] Transaction found in block ${blockNumber}`);

    // 3. Filter for our transaction
    const contract = getContract();
    
    console.log(`[PROCESSOR] Querying Contract at: ${contract.target}`);
    console.log(`[PROCESSOR] Fetching events for Block: ${blockNumber}`);

    const events = await contract.queryFilter('*', blockNumber, blockNumber);
    console.log(`[PROCESSOR] Found ${events.length} total events in block ${blockNumber}`);
    
    // 3. Filter for our transaction
    const txEvents = events.filter(e => e.transactionHash.toLowerCase() === txHash.toLowerCase());
    
    console.log(`[PROCESSOR] Found ${txEvents.length} events for TxHash: ${txHash}`);

    if (txEvents.length === 0) {
        // Log available events for debugging
        console.log("No matching events. Available TxHashes in block:");
        events.forEach(e => console.log(` - ${e.eventName}: ${e.transactionHash}`));
        
        throw new Error("No PharmaChain events found in this transaction");
    }

    // 4. Sort and Process
    txEvents.sort((a, b) => a.index - b.index);

    let processedCount = 0;
    for (const event of txEvents) {
         // Safety check: ensure we can resolve the event name
         const resolvedName = event.eventName || (event.fragment && event.fragment.name);
         
         if (!resolvedName) {
             console.warn(`[PROCESSOR] Skipping unidentified event at index ${event.index} (ABI Mismatch?)`);
             continue;
         }

        // Construct eventData compatible with processEvent
         const eventData = {
            eventName: resolvedName,
            args: parseEventArgs(event.args),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            logIndex: event.index,
            timestamp: (await provider.getBlock(blockNumber)).timestamp
        };

        // Reuse existing processing logic
        await processEvent(eventData);
        processedCount++;
    }

    return { processedCount, blockNumber };
}

// Helper for parsing args (duplicated from listener/manual scripts to be self-contained)
function parseEventArgs(args) {
  const parsed = {};
  if (args && typeof args.toObject === 'function') {
    const obj = args.toObject();
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'bigint')parsed[key] = Number(value);
      else if (typeof value === 'string') parsed[key] = value;
      else if (typeof value === 'number') parsed[key] = value;
      else if (value !== null && value !== undefined) parsed[key] = value.toString();
      else parsed[key] = value;
    }
  }
  return parsed;
}

export const eventProcessor = {
  processEvent,
  processTransaction
};

