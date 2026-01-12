import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI
const artifactPath = path.join(__dirname, '../../../artifacts/contracts/PharmaChainV2.sol/PharmaChainV2.json');
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Configuration
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '31337');

if (!CONTRACT_ADDRESS) {
  throw new Error('CONTRACT_ADDRESS environment variable is required');
}

/**
 * Blockchain Provider and Contract Setup
 */
export function getProvider() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Add error handling
  provider.on('error', (error) => {
    console.error('❌ Provider error:', error);
  });

  return provider;
}

/**
 * Get PharmaChain contract instance
 */
export function getContract() {
  const provider = getProvider();
  console.log(`[DEBUG] Creating contract instance:`);
  console.log(`  Address: ${CONTRACT_ADDRESS}`);
  console.log(`  ABI events count: ${contractArtifact.abi.filter(item => item.type === 'event').length}`);
  
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    contractArtifact.abi,
    provider
  );

  return contract;
}

/**
 * Get current block number
 */
export async function getCurrentBlockNumber() {
  const provider = getProvider();
  return await provider.getBlockNumber();
}

/**
 * Get contract deployment block (from deployment artifacts)
 */
export function getDeploymentBlock(chainId) {
  try {
    let deploymentFile = 'localhost.json';
    
    // Use passed chainId or fallback to env
    const targetChainId = chainId || process.env.CHAIN_ID;

    // Check Chain ID
    if (targetChainId == 11155111) {
      deploymentFile = 'sepolia.json';
    }
    
    const deploymentPath = path.join(__dirname, '../../../deployments', deploymentFile);
    
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      const block = deployment.contracts.PharmaChain.blockNumber || 0;
      console.log(`[BLOCKCHAIN] Deployment Block: ${block} (${deploymentFile})`);
      return block;
    }
    
    console.warn(`⚠️  Deployment file ${deploymentFile} not found, starting from block 0`);
    return 0;
  } catch (error) {
    console.warn('⚠️  Could not read deployment block, starting from block 0');
    return 0;
  }
}

/**
 * Verify connection to blockchain
 */
export async function verifyConnection() {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log('[BLOCKCHAIN] Connected');
    console.log(`[BLOCKCHAIN] Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`[BLOCKCHAIN] Current block: ${blockNumber}`);
    console.log(`[BLOCKCHAIN] Contract: ${CONTRACT_ADDRESS}`);
    
    return true;
  } catch (error) {
    console.error('❌ Blockchain connection failed:', error.message);
    return false;
  }
}

export const config = {
  rpcUrl: RPC_URL,
  contractAddress: CONTRACT_ADDRESS,
  chainId: CHAIN_ID,
  abi: contractArtifact.abi
};
