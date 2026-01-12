import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmachain';

async function resetSyncState() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete the old sync state
    const deleteResult = await mongoose.connection.db.collection('syncstates').deleteOne({ _id: 'pharmachain-sync' });
    console.log(`Deleted old sync state: ${deleteResult.deletedCount} document(s)`);
    
    // Create new sync state starting from block 8 (to re-process block 9)
    const contractAddress = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
    await mongoose.connection.db.collection('syncstates').insertOne({
      _id: 'pharmachain-sync',
      lastProcessedBlock: 8,
      contractAddress: contractAddress.toLowerCase(),
      chainId: 31337,
      lastSyncedAt: new Date(),
      isSyncing: false
    });
    console.log('Created new sync state starting from block 8');
    
    // Check current batches
    const batchCount = await mongoose.connection.db.collection('batches').countDocuments();
    console.log(`Current batches in DB: ${batchCount}`);
    
    console.log('\n✅ Sync state reset! Restart the worker to re-sync from block 0.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetSyncState();
