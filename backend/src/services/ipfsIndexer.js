const axios = require('axios');
const Batch = require('../models/Batch');

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'; // Or a dedicated gateway like Pinata

/**
 * Fetches JSON metadata from IPFS and updates the Batch document
 * @param {string} batchId - The on-chain batch ID
 * @param {string} ipfsHash - The CID of the metadata JSON
 */
async function processMetadata(batchId, ipfsHash) {
  try {
    console.log(`[Indexer] Processing metadata for Batch ${batchId} (CID: ${ipfsHash})`);

    // 1. Fetch JSON from IPFS
    // Using a timeout to prevent hanging if gateway is slow
    const response = await axios.get(`${IPFS_GATEWAY}${ipfsHash}`, { timeout: 10000 });
    const metadata = response.data;

    if (!metadata) {
      console.warn(`[Indexer] No data found for CID: ${ipfsHash}`);
      return;
    }

    // 2. Extract Fields
    const updateData = {
      productName: metadata.productName || 'Unknown Product',
      expiryDate: metadata.expiryDate,
      dosageInstructions: metadata.dosage, // Assuming 'dosage' key in JSON
      manufacturerName: metadata.manufacturerOverride || null, // Optional override
      pdfUrl: metadata.pdf ? `${IPFS_GATEWAY}${metadata.pdf.replace('ipfs://', '')}` : null,
      ipfsMetadataHash: ipfsHash,
      metadata: metadata // Store full object just in case
    };

    // 3. Update MongoDB
    // Using findOneAndUpdate to handle potential race conditions with creation
    const batch = await Batch.findOneAndUpdate(
      { batchId: batchId.toString() },
      { $set: updateData },
      { new: true, upsert: true } // Create if doesn't exist (edge case)
    );

    console.log(`[Indexer] ✅ Batch ${batchId} updated with metadata: ${batch.productName}`);
  } catch (error) {
    console.error(`[Indexer] ❌ Failed to process metadata for Batch ${batchId}:`, error.message);
    // Optional: Add to a retry queue (skipped for simplified implementation)
  }
}

module.exports = {
  processMetadata
};
