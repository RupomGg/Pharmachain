import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

// Load contract ABI
const artifactPath = path.join(__dirname, '../../artifacts/contracts/PharmaChain.sol/PharmaChain.json');
let contractABI;
try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  contractABI = artifact.abi;
} catch (error) {
  console.log('Could not load PharmaChain.sol, trying PharmaChainV2.sol...');
  const v2Path = path.join(__dirname, '../../artifacts/contracts/PharmaChainV2.sol/PharmaChainV2.json');
  const artifact = JSON.parse(fs.readFileSync(v2Path, 'utf8'));
  contractABI = artifact.abi;
}

async function checkTransaction() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const iface = new ethers.Interface(contractABI);
    
    const txHash = '0x0d5408c391548146265732d3161cfd7691994a4696b062b427a09a8fd8064d2c';
    
    console.log(`Checking transaction: ${txHash}\n`);
    
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      console.log('❌ Transaction not found on the blockchain');
      console.log('This could mean:');
      console.log('  1. The Hardhat node was restarted and lost the transaction');
      console.log('  2. The transaction hash is from a different network');
      console.log('  3. The transaction was never mined\n');
      
      const currentBlock = await provider.getBlockNumber();
      console.log(`Current block number: ${currentBlock}`);
      
      return;
    }
    
    console.log('✅ Transaction found!');
    console.log(`Block Number: ${tx.blockNumber}`);
    console.log(`From: ${tx.from}`);
    console.log(`To: ${tx.to}`);
    console.log(`Data (first 10 bytes): ${tx.data.substring(0, 10)}`);
    
    // Decode function call
    try {
      const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
      console.log(`\n📝 Function Called: ${decoded.name}`);
      console.log(`Arguments:`);
      decoded.args.forEach((arg, i) => {
        const fragment = decoded.fragment.inputs[i];
        console.log(`  ${fragment.name} (${fragment.type}): ${arg.toString()}`);
      });
    } catch (e) {
      console.log(`Could not decode function call: ${e.message}`);
      console.log(`Raw data: ${tx.data}`);
    }
    
    console.log(`\nStatus: ${tx.blockNumber ? 'Mined' : 'Pending'}\n`);
    
    if (tx.blockNumber) {
      const receipt = await provider.getTransactionReceipt(txHash);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`Status: ${receipt.status === 1 ? 'Success ✅' : 'Failed ❌'}`);
      console.log(`Events Emitted: ${receipt.logs.length}\n`);
      
      if (receipt.logs.length > 0) {
        console.log('📢 Events:');
        receipt.logs.forEach((log, i) => {
          try {
            const parsed = iface.parseLog(log);
            console.log(`  ${i + 1}. ${parsed.name}`);
            console.log(`     Args:`, parsed.args.map(arg => arg.toString()));
          } catch (e) {
            console.log(`  ${i + 1}. Unknown event (Topic: ${log.topics[0].substring(0, 10)}...)`);
          }
        });
      } else {
        console.log('⚠️  NO EVENTS EMITTED - This is why MongoDB is empty!');
        console.log('The transaction succeeded but did not emit BatchCreated event.');
        console.log('\n🔍 Possible causes:');
        console.log('  1. Wrong function called (function that doesn\'t emit events)');
        console.log('  2. Contract ABI mismatch (frontend using different contract)');
        console.log('  3. Transaction reverted silently');
        console.log('  4. Event not defined in the deployed contract');
      }
    }
    
    const currentBlock = await provider.getBlockNumber();
    console.log(`\nCurrent blockchain block: ${currentBlock}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTransaction();
