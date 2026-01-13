
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("--- DEBUG START ---");
    const rpcUrl = 'https://ethereum-sepolia.publicnode.com'; 
    const contractAddress = '0xb3dC2c70DC31b7498AacDBdB1e638F541Ae75768'; // From deployments/sepolia.json
    
    console.log(`RPC URL: ${rpcUrl}`);
    console.log(`Contract Address: ${contractAddress}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    try {
        const net = await provider.getNetwork();
        console.log(`Connected to network: ${net.name} (${net.chainId})`);
    } catch (e) {
        console.error("Failed to connect to provider:", e.message);
        return;
    }

    const code = await provider.getCode(contractAddress);
    console.log(`Code at ${contractAddress}: ${code.slice(0, 50)}... (${code.length} bytes)`);
    if (code === '0x') {
        console.error("CRITICAL: Even the 'valid' address has no code!");
    } else {
        console.log("SUCCESS: This address has code!");
    }
    
    // Check specific transaction
    const txHash = "0x9e2ca372afcf50daf45e0a203aa8c9d2e9c1609870ca2ef558319b78118aa07b";
    console.log(`Checking Transaction: ${txHash}`);

    const tx = await provider.getTransaction(txHash);
    if (!tx) {
        console.error("Transaction not found!");
        return;
    }
    console.log(`Transaction TO: ${tx.to}`);

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
        console.error("Receipt not found!");
        return;
    }
    console.log(`Receipt Status: ${receipt.status}`);
    console.log(`Block Number: ${receipt.blockNumber}`);
    
    // Load ABI to decode logs
    const artifactPath = path.join(__dirname, 'src/config/PharmaChainV2.json');
    let abi = [];
    if (fs.existsSync(artifactPath)) {
         const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
         abi = artifact.abi;
    } else {
        console.log("Artifact not found, using empty ABI (will show raw logs)");
    }

    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Identify Function Selector 0xbbf28e02
    console.log("Checking ABI for selector 0xbbf28e02...");
    contract.interface.fragments.forEach(f => {
        if (f.type === 'function') {
            const sig = f.format();
            const id =  ethers.id(sig).slice(0, 10);
            if (id === '0xbbf28e02') {
                console.log(`MATCH FOUND: ${sig} -> ${id}`);
            }
        }
    });

    // Fetch logs using the same logic as the backend
    console.log(`Querying logs for block ${receipt.blockNumber}...`);
    const events = await contract.queryFilter('*', receipt.blockNumber, receipt.blockNumber);
    console.log(`Total Events in Block: ${events.length}`);

    const txEvents = events.filter(e => e.transactionHash.toLowerCase() === txHash.toLowerCase());
    console.log(`Events for this TX: ${txEvents.length}`);
    
    if (txEvents.length === 0) {
        console.log("No events found. Checking raw logs in receipt...");
        receipt.logs.forEach((log, i) => {
            console.log(`Log ${i} Address: ${log.address}`);
            console.log(`Expected Address: ${contractAddress}`);
            if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
                console.log("MATCH! But queryFilter missed it?");
            } else {
                console.log("MISMATCH! Ensure CONTRACT_ADDRESS is correct.");
            }
            console.log(`Topics: ${log.topics}`);
        });
    } else {
        txEvents.forEach(e => {
            console.log(`Event: ${e.eventName}`);
        });
    }
    // Check contract state to see if batch exists
    try {
        const totalBatches = await contract.getTotalBatches();
        console.log(`Total Batches on Chain: ${totalBatches.toString()}`);

        if (totalBatches > 0) {
            const lastId = totalBatches; // Assuming 1-based indexing from V1 code
            console.log(`Reading Batch #${lastId}...`);
            const batch = await contract.getBatch(lastId);
            console.log("Last Batch Details:");
            console.log(`- ID: ${batch.id}`);
            console.log(`- Qty: ${batch.quantity}`);
            console.log(`- Unit: ${batch.unit}`);
            console.log(`- Owner: ${batch.currentOwner}`);
            console.log(`- Created: ${new Date(Number(batch.createdAt) * 1000).toISOString()}`);
        }
    } catch (err) {
        console.error("Failed to read contract state:", err.message);
    }

    console.log("--- DEBUG END ---");
}

main().catch(console.error);
