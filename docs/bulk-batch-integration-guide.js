// Frontend/Backend Integration Guide for Bulk Batch Creation
// This file shows how to integrate the createBatchesBulk function with your application

// ============================================
// 1. FRONTEND: CSV Upload and Processing
// ============================================

/**
 * Example CSV format:
 * quantity,unit,ipfsHash,manufacturerBatchNumber
 * 1000,Box,QmHash1234567890abcdef,BN-101
 * 2000,Box,QmHash2234567890abcdef,BN-102
 * 1500,Vial,QmHash3234567890abcdef,BN-103
 */

// React component for CSV upload
import { useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import Papa from 'papaparse'; // CSV parser

function BulkBatchUpload() {
    const [csvData, setCsvData] = useState(null);
    const [processing, setProcessing] = useState(false);
    
    // Parse CSV file
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                // Validate and transform data
                const batches = results.data.filter(row => row.quantity); // Remove empty rows
                
                if (batches.length > 50) {
                    alert('Maximum 50 batches per upload. Please split your CSV.');
                    return;
                }
                
                // Transform to contract format
                const quantities = batches.map(b => parseInt(b.quantity));
                const units = batches.map(b => b.unit);
                const ipfsHashes = batches.map(b => b.ipfsHash);
                const manufacturerBatchNumbers = batches.map(b => b.manufacturerBatchNumber);
                
                setCsvData({
                    quantities,
                    units,
                    ipfsHashes,
                    manufacturerBatchNumbers
                });
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                alert('Failed to parse CSV file');
            }
        });
    };
    
    // Contract interaction
    const { write, data: txData } = useContractWrite({
        address: process.env.REACT_APP_PHARMACHAIN_ADDRESS,
        abi: pharmaChainABI,
        functionName: 'createBatchesBulk',
        args: csvData ? [
            csvData.quantities,
            csvData.units,
            csvData.ipfsHashes,
            csvData.manufacturerBatchNumbers
        ] : undefined,
    });
    
    const { isLoading, isSuccess } = useWaitForTransaction({
        hash: txData?.hash,
    });
    
    const handleSubmit = async () => {
        if (!csvData) {
            alert('Please upload a CSV file first');
            return;
        }
        
        setProcessing(true);
        try {
            await write();
        } catch (error) {
            console.error('Transaction error:', error);
            alert('Failed to create batches: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };
    
    return (
        <div className="bulk-upload-container">
            <h2>Bulk Batch Import</h2>
            
            <div className="upload-section">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={processing || isLoading}
                />
                
                {csvData && (
                    <div className="preview">
                        <p>Ready to create {csvData.quantities.length} batches</p>
                        <ul>
                            {csvData.manufacturerBatchNumbers.slice(0, 5).map((bn, i) => (
                                <li key={i}>
                                    {bn}: {csvData.quantities[i]} {csvData.units[i]}
                                </li>
                            ))}
                            {csvData.quantities.length > 5 && <li>... and {csvData.quantities.length - 5} more</li>}
                        </ul>
                    </div>
                )}
            </div>
            
            <button
                onClick={handleSubmit}
                disabled={!csvData || processing || isLoading}
            >
                {isLoading ? 'Creating Batches...' : 'Create Batches'}
            </button>
            
            {isSuccess && (
                <div className="success-message">
                    ✅ Successfully created {csvData.quantities.length} batches!
                </div>
            )}
        </div>
    );
}

// ============================================
// 2. BACKEND: Event Indexing
// ============================================

// Listen for BulkBatchCreated events and index manufacturer batch numbers
const { ethers } = require('ethers');

async function indexBulkBatchEvents() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
        process.env.PHARMACHAIN_ADDRESS,
        pharmaChainABI,
        provider
    );
    
    // Listen for BulkBatchCreated events
    contract.on('BulkBatchCreated', async (firstBatchId, count, manufacturer, manufacturerBatchNumbers, event) => {
        console.log(`Bulk batch created: ${count} batches starting from ID ${firstBatchId}`);
        
        // Index each batch
        for (let i = 0; i < count; i++) {
            const blockchainId = firstBatchId + BigInt(i);
            const manufacturerBatchNumber = manufacturerBatchNumbers[i];
            
            // Store in database
            await db.batches.create({
                blockchainId: blockchainId.toString(),
                manufacturerBatchNumber,
                manufacturer,
                transactionHash: event.log.transactionHash,
                blockNumber: event.log.blockNumber,
                createdAt: new Date()
            });
            
            console.log(`Indexed: ${manufacturerBatchNumber} -> Blockchain ID ${blockchainId}`);
        }
    });
    
    console.log('Event listener started for BulkBatchCreated');
}

// ============================================
// 3. BACKEND: Historical Event Sync
// ============================================

// Sync historical bulk batch events (run once on startup)
async function syncHistoricalBulkBatches() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
        process.env.PHARMACHAIN_ADDRESS,
        pharmaChainABI,
        provider
    );
    
    // Get deployment block (or last synced block)
    const fromBlock = await db.settings.get('lastSyncedBlock') || 0;
    const toBlock = 'latest';
    
    console.log(`Syncing BulkBatchCreated events from block ${fromBlock} to ${toBlock}`);
    
    // Query past events
    const filter = contract.filters.BulkBatchCreated();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    console.log(`Found ${events.length} bulk batch creation events`);
    
    for (const event of events) {
        const { firstBatchId, count, manufacturer, manufacturerBatchNumbers } = event.args;
        
        for (let i = 0; i < count; i++) {
            const blockchainId = firstBatchId + BigInt(i);
            const manufacturerBatchNumber = manufacturerBatchNumbers[i];
            
            // Upsert to database (avoid duplicates)
            await db.batches.upsert({
                blockchainId: blockchainId.toString(),
                manufacturerBatchNumber,
                manufacturer,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                createdAt: new Date()
            });
        }
    }
    
    // Update last synced block
    const latestBlock = await provider.getBlockNumber();
    await db.settings.set('lastSyncedBlock', latestBlock);
    
    console.log('Historical sync completed');
}

// ============================================
// 4. API ENDPOINT: Query by Manufacturer Batch Number
// ============================================

// Express.js endpoint to query batches by manufacturer batch number
const express = require('express');
const router = express.Router();

router.get('/batches/by-manufacturer-number/:batchNumber', async (req, res) => {
    try {
        const { batchNumber } = req.params;
        
        // Query database
        const batch = await db.batches.findOne({
            where: { manufacturerBatchNumber: batchNumber }
        });
        
        if (!batch) {
            return res.status(404).json({
                error: 'Batch not found',
                manufacturerBatchNumber: batchNumber
            });
        }
        
        // Fetch full batch details from blockchain
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new ethers.Contract(
            process.env.PHARMACHAIN_ADDRESS,
            pharmaChainABI,
            provider
        );
        
        const blockchainBatch = await contract.getBatch(batch.blockchainId);
        
        res.json({
            manufacturerBatchNumber: batch.manufacturerBatchNumber,
            blockchainId: batch.blockchainId,
            quantity: blockchainBatch.quantity.toString(),
            unit: blockchainBatch.unit,
            currentOwner: blockchainBatch.currentOwner,
            manufacturer: blockchainBatch.manufacturer,
            status: blockchainBatch.status,
            createdAt: new Date(Number(blockchainBatch.createdAt) * 1000),
            lastUpdated: new Date(Number(blockchainBatch.lastUpdated) * 1000)
        });
        
    } catch (error) {
        console.error('Error fetching batch:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

// ============================================
// 5. UTILITY: Chunk Large CSV Files
// ============================================

// For CSV files with > 50 batches, split into chunks
function chunkBatches(batches, chunkSize = 50) {
    const chunks = [];
    for (let i = 0; i < batches.length; i += chunkSize) {
        chunks.push(batches.slice(i, i + chunkSize));
    }
    return chunks;
}

// Example usage
async function uploadLargeCSV(batches) {
    const chunks = chunkBatches(batches, 50);
    
    console.log(`Uploading ${batches.length} batches in ${chunks.length} transactions`);
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const quantities = chunk.map(b => b.quantity);
        const units = chunk.map(b => b.unit);
        const ipfsHashes = chunk.map(b => b.ipfsHash);
        const manufacturerBatchNumbers = chunk.map(b => b.manufacturerBatchNumber);
        
        console.log(`Uploading chunk ${i + 1}/${chunks.length} (${chunk.length} batches)`);
        
        const tx = await contract.createBatchesBulk(
            quantities,
            units,
            ipfsHashes,
            manufacturerBatchNumbers
        );
        
        await tx.wait();
        console.log(`Chunk ${i + 1} completed`);
        
        // Optional: Add delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('All batches uploaded successfully');
}

// ============================================
// 6. GRAPH PROTOCOL: Subgraph Schema
// ============================================

/**
 * Example subgraph schema for indexing bulk batches
 * 
 * schema.graphql:
 * 
 * type BulkBatchOperation @entity {
 *   id: ID!
 *   firstBatchId: BigInt!
 *   count: Int!
 *   manufacturer: Bytes!
 *   manufacturerBatchNumbers: [String!]!
 *   transactionHash: Bytes!
 *   blockNumber: BigInt!
 *   timestamp: BigInt!
 * }
 * 
 * type Batch @entity {
 *   id: ID!
 *   blockchainId: BigInt!
 *   manufacturerBatchNumber: String
 *   quantity: BigInt!
 *   unit: String!
 *   manufacturer: Bytes!
 *   currentOwner: Bytes!
 *   status: Int!
 *   createdAt: BigInt!
 *   lastUpdated: BigInt!
 *   bulkOperation: BulkBatchOperation
 * }
 * 
 * mapping.ts:
 * 
 * export function handleBulkBatchCreated(event: BulkBatchCreatedEvent): void {
 *   let operation = new BulkBatchOperation(event.transaction.hash.toHex());
 *   operation.firstBatchId = event.params.firstBatchId;
 *   operation.count = event.params.count.toI32();
 *   operation.manufacturer = event.params.manufacturer;
 *   operation.manufacturerBatchNumbers = event.params.manufacturerBatchNumbers;
 *   operation.transactionHash = event.transaction.hash;
 *   operation.blockNumber = event.block.number;
 *   operation.timestamp = event.block.timestamp;
 *   operation.save();
 *   
 *   // Create individual batch entities
 *   for (let i = 0; i < event.params.count.toI32(); i++) {
 *     let batchId = event.params.firstBatchId.plus(BigInt.fromI32(i));
 *     let batch = Batch.load(batchId.toString());
 *     if (batch) {
 *       batch.manufacturerBatchNumber = event.params.manufacturerBatchNumbers[i];
 *       batch.bulkOperation = operation.id;
 *       batch.save();
 *     }
 *   }
 * }
 */

// ============================================
// 7. TESTING: Gas Estimation
// ============================================

async function estimateGasForBulkCreation() {
    const testCases = [1, 10, 25, 50];
    
    for (const count of testCases) {
        const quantities = new Array(count).fill(1000);
        const units = new Array(count).fill("Box");
        const ipfsHashes = new Array(count).fill("QmHash123");
        const manufacturerBatchNumbers = Array.from(
            { length: count },
            (_, i) => `BN-${String(i + 1).padStart(3, '0')}`
        );
        
        const gasEstimate = await contract.createBatchesBulk.estimateGas(
            quantities,
            units,
            ipfsHashes,
            manufacturerBatchNumbers
        );
        
        console.log(`Gas estimate for ${count} batches: ${gasEstimate.toString()}`);
        console.log(`Gas per batch: ${(gasEstimate / BigInt(count)).toString()}`);
    }
}

module.exports = {
    BulkBatchUpload,
    indexBulkBatchEvents,
    syncHistoricalBulkBatches,
    chunkBatches,
    uploadLargeCSV,
    estimateGasForBulkCreation
};
