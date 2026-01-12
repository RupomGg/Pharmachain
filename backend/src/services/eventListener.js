import { getContract, getCurrentBlockNumber, getDeploymentBlock, getProvider } from '../config/blockchain.js';
import { SyncState } from '../models/SyncState.js';
import { config } from '../config/blockchain.js';

/**
 * Event Listener - Blockchain Event Synchronization
 * 
 * Features:
 * - Real-time event listening
 * - Missed block recovery on startup
 * - Push events to BullMQ queue
 * - Auto-reconnect on connection loss
 */

const SYNC_BATCH_SIZE = parseInt(process.env.SYNC_BATCH_SIZE || '1000');

/**
 * Recover missed events on startup
 */
async function recoverMissedEvents() {
  console.log('\n[SYNC] Checking for missed events...');

  try {
    // Get or create sync state
    let syncState = await SyncState.findById('pharmachain-sync');
    
    // Detect real Chain ID
    const provider = getProvider();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    console.log(`[SYNC] Detected Network Chain ID: ${chainId}`);

    const deploymentBlock = getDeploymentBlock(chainId);

    if (!syncState) {
      syncState = await SyncState.create({
        _id: 'pharmachain-sync',
        lastProcessedBlock: deploymentBlock,
        contractAddress: config.contractAddress.toLowerCase(),
        chainId: chainId,
        lastSyncedAt: new Date()
      });
      console.log(`[SYNC] Initialized sync state from block ${deploymentBlock}`);
    } else {
        // Enforce Fast-Forward if DB is behind Deployment (e.g. stale state or reset)
        if (syncState.lastProcessedBlock < deploymentBlock) {
            console.warn(`[SYNC] ⚠️ Stale sync state detected (Last: ${syncState.lastProcessedBlock} < Deployment: ${deploymentBlock}). Fast-forwarding...`);
            syncState.lastProcessedBlock = deploymentBlock;
            await SyncState.findByIdAndUpdate('pharmachain-sync', { lastProcessedBlock: deploymentBlock });
        }
    }

    const currentBlock = await getCurrentBlockNumber();
    const lastProcessed = syncState.lastProcessedBlock;
    const missedBlocks = currentBlock - lastProcessed;

    console.log(`[SYNC] Last processed block: ${lastProcessed}`);
    console.log(`[SYNC] Current block: ${currentBlock}`);
    console.log(`[SYNC] Missed blocks: ${missedBlocks}`);

    // Detect Chain Reset (Hardhat restart) - Only for Localhost (31337)
    // For Sepolia, we rely on the DeploymentBlock check above.
    if (chainId === 31337 && currentBlock < lastProcessed) {
      console.warn(`[SYNC] ⚠️ Chain reset detected (Current: ${currentBlock} < Last: ${lastProcessed}). Resetting sync state...`);
      const deploymentBlock = getDeploymentBlock(chainId);
      await SyncState.findByIdAndUpdate('pharmachain-sync', { 
        lastProcessedBlock: deploymentBlock - 1,
        lastSyncedAt: new Date()
      });
      return recoverMissedEvents(); // Restart recovery
    }

    if (missedBlocks > 0) {
      console.log(`[SYNC] Fetching events from block ${lastProcessed + 1} to ${currentBlock}...`);
      
      // Mark as syncing
      await SyncState.findByIdAndUpdate('pharmachain-sync', { isSyncing: true });

      // Fetch events in batches to avoid RPC limits
      const contract = getContract();
      let fromBlock = lastProcessed + 1;

      while (fromBlock <= currentBlock) {
        const toBlock = Math.min(fromBlock + SYNC_BATCH_SIZE - 1, currentBlock);
        
        console.log(`  Fetching blocks ${fromBlock} to ${toBlock}...`);

        // Get all events in this range
        const events = await contract.queryFilter('*', fromBlock, toBlock);
        
        console.log(`  Found ${events.length} events`);

        // Sort events by block number and log index to ensure correct processing order
        events.sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) {
            return a.blockNumber - b.blockNumber;
          }
          return a.index - b.index;
        });

        // Process events directly (no queue)
        for (const event of events) {
          await processEventDirectly(event);
        }

        // Update sync state
        await SyncState.findByIdAndUpdate('pharmachain-sync', {
          lastProcessedBlock: toBlock,
          lastSyncedAt: new Date()
        });

        fromBlock = toBlock + 1;
      }

      // Mark sync complete
      await SyncState.findByIdAndUpdate('pharmachain-sync', { isSyncing: false });
      
      console.log(`[SYNC] Sync complete! Processed ${missedBlocks} blocks`);
    } else {
      console.log('[SYNC] No missed events');
    }

  } catch (error) {
    console.error('❌ Error recovering missed events:', error.message);
    throw error;
  }
}

/**
 * Start real-time event listener
 */
export async function startEventListener() {
  console.log('\n[LISTENER] Starting blockchain event listener...');

  try {
    // Step 1: Recover missed events
    await recoverMissedEvents();

    // Step 2: Start real-time listening
    const contract = getContract();

    console.log('[LISTENER] Listening for real-time events...\n');

    // Listen to all events using queryFilter polling instead of contract.on
    // This is more reliable for local development
    let lastBlock = await getCurrentBlockNumber();

    const pollInterval = setInterval(async () => {
      try {
        const currentBlock = await getCurrentBlockNumber();
        
        if (currentBlock > lastBlock) {
          console.log(`[LISTENER] Checking blocks ${lastBlock + 1} to ${currentBlock}...`);
          
          // Get events in new blocks
          console.log(`[DEBUG] Calling queryFilter('*', ${lastBlock + 1}, ${currentBlock})`);
          const events = await contract.queryFilter('*', lastBlock + 1, currentBlock);
          console.log(`[DEBUG] queryFilter returned ${events.length} events`);
          
          if (events.length > 0) {
            console.log(`Found ${events.length} new events`);
            
            // Sort events by block number and log index
            events.sort((a, b) => {
              if (a.blockNumber !== b.blockNumber) {
                return a.blockNumber - b.blockNumber;
              }
              return a.index - b.index;
            });
            
            for (const event of events) {
              console.log(`[EVENT] Received ${event.eventName || event.fragment.name} event (Block #${event.blockNumber})`);
              await processEventDirectly(event);
            }
          }
          
          // Update last processed block
          await SyncState.findByIdAndUpdate('pharmachain-sync', {
            lastProcessedBlock: currentBlock,
            lastSyncedAt: new Date()
          });
          
          lastBlock = currentBlock;
        }
      } catch (error) {
        console.error('Error polling events:', error.message);
      }
    }, 5000); // Poll every 5 seconds

    console.log('[LISTENER] Event listener started successfully (polling mode)\n');

    // Return cleanup function
    return () => clearInterval(pollInterval);

  } catch (error) {
    console.error('[ERROR] Failed to start event listener:', error.message);
    throw error;
  }
}

/**
 * Process event directly (without queue)
 */
async function processEventDirectly(event) {
  // Debug: Log raw event args
  console.log(`\n[DEBUG] Event ${event.eventName || event.fragment.name}`);
  console.log(`Raw args:`, event.args);
  console.log(`Args keys:`, Object.keys(event.args));
  
  const eventData = {
    eventName: event.eventName || event.fragment.name,
    args: parseEventArgs(event.args),
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    logIndex: event.index,
    timestamp: event.block?.timestamp || Math.floor(Date.now() / 1000)
  };

  console.log(`[DEBUG] Parsed args:`, eventData.args);

  // Import event processor dynamically to avoid circular dependency
  const { eventProcessor } = await import('./eventProcessor.js');
  
  try {
    await eventProcessor.processEvent(eventData);
  } catch (error) {
    console.error(`Failed to process event ${eventData.transactionHash}-${eventData.logIndex}:`, error.message);
  }
}

/**
 * Parse event arguments to plain object
 */
function parseEventArgs(args) {
  const parsed = {};
  
  // Ethers.js v6 Result objects have a toObject() method
  if (args && typeof args.toObject === 'function') {
    const obj = args.toObject();
    
    for (const key in obj) {
      const value = obj[key];
      
      // Convert BigInt to Number for MongoDB
      if (typeof value === 'bigint') {
        parsed[key] = Number(value);
      }
      // Keep strings as-is
      else if (typeof value === 'string') {
        parsed[key] = value;
      }
      // Convert numbers
      else if (typeof value === 'number') {
        parsed[key] = value;
      }
      // For other types, convert to string
      else if (value !== null && value !== undefined) {
        parsed[key] = value.toString();
      }
      else {
        parsed[key] = value;
      }
    }
  }
  
  return parsed;
}

/**
 * Stop event listener
 */
export async function stopEventListener() {
  const contract = getContract();
  contract.removeAllListeners();
  console.log('Event listener stopped');
}
