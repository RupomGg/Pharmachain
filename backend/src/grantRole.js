import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

// Load contract ABI
const artifactPath = path.join(__dirname, '../../artifacts/contracts/PharmaChain.sol/PharmaChain.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

async function grantRole() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Get the deployer account (has admin role)
    const deployer = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat account #0
      provider
    );
    
    // Get the user account (account #1)
    const userAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    
    console.log(`Granting MANUFACTURER_ROLE to: ${userAddress}\n`);
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, deployer);
    
    // Check if user already has the role
    const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MANUFACTURER_ROLE'));
    const hasRole = await contract.hasRole(MANUFACTURER_ROLE, userAddress);
    
    if (hasRole) {
      console.log('✅ User already has MANUFACTURER_ROLE');
      return;
    }
    
    // Grant the role
    console.log('Granting role...');
    const tx = await contract.grantManufacturerRole(userAddress);
    console.log(`Transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log('✅ MANUFACTURER_ROLE granted successfully!');
    
    // Verify
    const hasRoleNow = await contract.hasRole(MANUFACTURER_ROLE, userAddress);
    console.log(`\nVerification: User has role = ${hasRoleNow}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

grantRole();
