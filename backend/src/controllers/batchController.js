import { Batch } from '../models/Batch.js';
import { uploadToIpfs } from '../utils/ipfsUtils.js';
import { calculateTotalUnits } from '../utils/batchUtils.js';
import csv from 'fast-csv';
import pLimit from 'p-limit';
import { Readable } from 'stream';

/**
 * Unified Batch Processor
 * Handles validation, IPFS upload, and DB saving.
 * @param {Array} batches - Array of batch inputs
 * @param {String} owner - The address of the user creating the batches
 * @returns {Promise<Object>} - { storedBatches, contractData }
 */
async function processBatchData(batches, owner) {
  if (!batches || batches.length === 0) {
    throw new Error('No valid batches provided');
  }

  // Check for duplicate batch numbers in the input
  const batchNumbers = batches.map(b => b.batchNumber);
  const duplicates = batchNumbers.filter((item, index) => batchNumbers.indexOf(item) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate batch numbers in input: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check DB for existing manufacturerBatchNo (batchNumber in new schema)
  const existing = await Batch.find({ batchNumber: { $in: batchNumbers } });
  
  // Filter out batches that are already processed (Minted/Sold/etc)
  const existingProcessed = existing.filter(b => b.status !== 'CREATED');

  if (existingProcessed.length > 0) {
    throw new Error(`Batches already processed/minted: ${existingProcessed.map(b => b.batchNumber).join(', ')}`);
  }

  console.log(`Processing ${batches.length} batches...`);

  const limit = pLimit(5);
  const processedBatches = await Promise.all(batches.map(batch => limit(async () => {
    // 1. Upload Clean Metadata to IPFS
    const ipfsHash = await uploadToIpfs(batch);

    // 2. Prepare Batch Document (Clean Schema)
    // Calculate totalUnitsPerPack if not provided or 0
    const calculatedTotalUnits = (batch.totalUnitsPerPack && batch.totalUnitsPerPack > 0) 
      ? batch.totalUnitsPerPack 
      : calculateTotalUnits(batch.packComposition);

    const newBatchData = {
      batchId: batch.batchId || 0, 
      batchNumber: batch.batchNumber,
      manufacturer: batch.manufacturer || owner,
      owner: owner,
      quantity: batch.quantity,
      status: 'CREATED',
      productName: batch.productName,
      dosageStrength: batch.dosageStrength,
      packingType: batch.packingType || 'Box',
      baseUnit: batch.baseUnit || 'Unit',
      packComposition: batch.packComposition,
      totalUnitsPerPack: calculatedTotalUnits,
      expiryDate: batch.expiryDate,
      productImage: batch.productImage,
      ingredients: batch.ingredients,
      storageTemp: batch.storageTemp,
      financials: {
        baseUnitCost: batch.baseUnitCost || 0,
        baseUnitPrice: batch.baseUnitPrice || 0,
        currency: batch.currency || 'USD'
      },
      ipfsHash: ipfsHash,
      txHash: batch.txHash || '',
      blockNumber: batch.blockNumber || 0
    };

    // 3. Save to MongoDB (Upsert Logic)
    // If it exists (and is CREATED per check above), update it.
    // If not, create it.
    const savedBatch = await Batch.findOneAndUpdate(
      { batchNumber: batch.batchNumber },
      newBatchData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return savedBatch;
  })));

  // 4. Prepare Contract Data for Frontend Minting
  const contractData = {
    quantities: processedBatches.map(b => b.quantity),
    units: processedBatches.map(b => b.packingType), // Use packingType as the unit for contract
    ipfsHashes: processedBatches.map(b => b.ipfsHash),
    manufacturerBatchNumbers: processedBatches.map(b => b.batchNumber)
  };

  return {
    success: true,
    processedCount: processedBatches.length,
    batches: processedBatches,
    contractData // <--- Critical for frontend minting
  };
}

/**
 * Create Batches (Manual)
 * POST /api/batches/create
 */
export const createBatch = async (req, res) => {
  try {
    const { batches } = req.body;
    const owner = req.user.address; // From middleware

    const result = await processBatchData(batches, owner);

    res.status(200).json({
      success: true,
      message: `Successfully created ${result.processedCount} batches`,
      batches: result.batches, // Renaming data -> batches to match frontend expectation
      contractData: result.contractData // <--- Missing piece
    });

  } catch (error) {
    console.error('Create Batch Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Upload Bulk CSV
 * POST /api/batches/upload-csv
 */
export const uploadBulkBatchCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const batches = [];
    const stream = Readable.from(req.file.buffer);

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv.parse({ headers: true, trim: true }))
        .on('data', (row) => {
          batches.push({
            batchNumber: row.batchNumber,
            productName: row.productName,
            quantity: parseInt(row.quantity),
            expiryDate: row.expiryDate, // Date or String
            dosageStrength: row.dosageStrength,
            packingType: row.packingType,
            ingredients: row.ingredients,
            storageTemp: row.storageTemp,
            productImage: row.productImage,
            baseUnitCost: parseFloat(row.baseUnitCost),
            baseUnitPrice: parseFloat(row.baseUnitPrice),
            manufacturer: req.user.address // Assume uploader is manufacturer
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const result = await processBatchData(batches, req.user.address);

    res.status(200).json({
      success: true,
      message: `Processed ${result.processedCount} from CSV`,
      data: result.batches
    });

  } catch (error) {
    console.error('CSV Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get Manufacturer Stats
 * GET /api/batches/stats
 */
export const getManufacturerStats = async (req, res) => {
  try {
    const owner = req.user.address;

    const totalBatches = await Batch.countDocuments({ owner });

    // Calculate Inventory Value: quantity * financials.baseUnitPrice
    const inventoryResult = await Batch.aggregate([
      { $match: { owner: owner, status: { $ne: 'RECALLED' } } },
      {
        $group: {
          _id: null,
          totalValue: { 
            $sum: { $multiply: ['$quantity', '$financials.baseUnitPrice'] } 
          }
        }
      }
    ]);

    const inventoryValue = inventoryResult.length > 0 ? inventoryResult[0].totalValue : 0;
    const lowStockCount = await Batch.countDocuments({ owner, quantity: { $lt: 100 }, status: { $ne: 'RECALLED' } });

    res.json({
      success: true,
      stats: { totalBatches, inventoryValue, lowStockCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Search Batches
 * GET /api/batches/search
 */
export const searchBatches = async (req, res) => {
  try {
    const owner = req.user.address;
    const { q, status, page = 1, limit = 20 } = req.query;

    const query = { owner };
    if (q) {
      query.$or = [
        { productName: { $regex: q, $options: 'i' } },
        { batchNumber: { $regex: q, $options: 'i' } }
      ];
    }
    if (status && status !== 'ALL') query.status = status;
    
    // Exclude Drafts (Batch 0)
    query.batchId = { $ne: 0 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const batches = await Batch.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Batch.countDocuments(query);

    res.json({
      success: true,
      batches,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get public batch info
 */
export const getBatchByManufacturerNumber = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const batch = await Batch.findOne({ batchNumber }).select('-financials'); // Hide private financials
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

