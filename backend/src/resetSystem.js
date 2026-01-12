import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Complete System Reset Script
 * 
 * This script clears:
 * 1. MongoDB - All batches, event logs, sync states, users, etc.
 * 2. Blockchain - Restart Hardhat node (manual step)
 * 3. Pinata - Cannot be automated (files remain on IPFS)
 * 
 * WARNING: This will delete ALL data from MongoDB!
 */

async function resetSystem() {
  try {
    console.log('\n🔄 Starting Complete System Reset...\n');
    
    // ============ MongoDB Reset ============
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmachain');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections\n`);
    
    // Drop each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`  Dropping collection: ${collectionName}`);
      await db.collection(collectionName).drop();
    }
    
    console.log('\n✅ All MongoDB collections dropped\n');
    
    // ============ Summary ============
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ MongoDB: CLEARED');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('📋 Next Steps:\n');
    console.log('1. BLOCKCHAIN RESET:');
    console.log('   - Stop Hardhat node (Ctrl+C in terminal)');
    console.log('   - Restart: npx hardhat node');
    console.log('   - Redeploy contract: npx hardhat run scripts/deploy.js --network localhost');
    console.log('   - Update CONTRACT_ADDRESS in .env files\n');
    
    console.log('2. RESTART SERVICES:');
    console.log('   - Restart backend API (npm run dev)');
    console.log('   - Restart event listener worker (node src/workerSimple.js)');
    console.log('   - Frontend should auto-reload\n');
    
    console.log('3. PINATA (Optional):');
    console.log('   - Files uploaded to Pinata/IPFS remain permanently');
    console.log('   - To clean up: Manually delete files from Pinata dashboard');
    console.log('   - URL: https://app.pinata.cloud/pinmanager\n');
    
    console.log('4. GRANT ROLES:');
    console.log('   - After redeploying, grant MANUFACTURER_ROLE to your account');
    console.log('   - Run: node src/grantRole.js\n');
    
    console.log('✨ System reset complete! Follow the steps above to restart.\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during reset:', error.message);
    process.exit(1);
  }
}

resetSystem();
