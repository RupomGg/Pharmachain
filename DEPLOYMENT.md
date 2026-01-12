# PharmaChain Deployment Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Deploy to Localhost

#### Start Hardhat Node (Terminal 1)
```bash
npm run node
# or
npx hardhat node
```

This starts a local Ethereum node on `http://127.0.0.1:8545` with Chain ID `31337`.

#### Deploy Contract (Terminal 2)
```bash
npm run deploy:localhost
# or
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**
```
🚀 Starting PharmaChain UUPS Deployment...
📝 Deploying with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Account balance: 10000.0 ETH
✅ PharmaChain Proxy deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
📋 Implementation contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Important:** Use the **Proxy Address** in your frontend!

---

## 🦊 MetaMask Configuration for Localhost

### Add Hardhat Network to MetaMask

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter the following details:

| Field | Value |
|-------|-------|
| **Network Name** | Hardhat Local |
| **RPC URL** | `http://127.0.0.1:8545` |
| **Chain ID** | `31337` |
| **Currency Symbol** | ETH |

4. Click "Save"

### Import Test Account

When you run `npx hardhat node`, it provides 20 test accounts with private keys.

**Example Account #0:**
```
Account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

To import:
1. MetaMask → Click account icon → "Import Account"
2. Paste the private key (without `0x` prefix)
3. Click "Import"

**⚠️ WARNING:** Never use these keys on mainnet or with real funds!

---

## 📦 Deployment Scripts

### Deploy Script (`scripts/deploy.js`)

Deploys the UUPS proxy with initialization:

```bash
# Localhost
npm run deploy:localhost

# Sepolia Testnet
npm run deploy:sepolia
```

**What it does:**
1. Deploys UUPS proxy and implementation
2. Initializes contract with admin address
3. Grants MANUFACTURER_ROLE to deployer
4. Saves deployment addresses to `deployments/<network>.json`
5. Optionally verifies on Etherscan (testnet/mainnet only)

### Upgrade Script (`scripts/upgrade.js`)

Upgrades the contract to a new version:

```bash
# Localhost
npm run upgrade:localhost

# Sepolia Testnet
npm run upgrade:sepolia
```

**What it does:**
1. Loads existing proxy address
2. Validates upgrade safety (storage layout)
3. Deploys new implementation
4. Upgrades proxy to new implementation
5. Verifies data preservation
6. Updates deployment file with upgrade history

### Verify Script (`scripts/verify.js`)

Verifies implementation on Etherscan:

```bash
npm run verify
```

---

## 🔄 Upgrade Process

### Step 1: Create V2 Contract

Create a new contract that inherits from the original:

```solidity
// contracts/PharmaChainV2.sol
import "./PharmaChain.sol";

contract PharmaChainV2 is PharmaChain {
    // Add new state variables at the END
    string private _version;
    
    // Add new functions
    function getVersion() public view returns (string memory) {
        return _version;
    }
    
    // Adjust storage gap
    uint256[49] private __gapV2; // Reduced by 1 for new variable
}
```

### Step 2: Run Upgrade Script

```bash
npm run upgrade:localhost
```

### Step 3: Verify Upgrade

The frontend continues using the **same proxy address**. No changes needed!

---

## 🌐 Deploying to Testnets/Mainnet

### 1. Create `.env` File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env`:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
ADMIN_ADDRESS=0xYourAdminAddress
```

### 3. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

### 4. Verify on Etherscan

```bash
npm run verify
```

---

## 📁 Deployment Artifacts

After deployment, check `deployments/<network>.json`:

```json
{
  "network": "localhost",
  "chainId": "31337",
  "contracts": {
    "PharmaChain": {
      "proxy": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      "implementation": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "admin": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "deployedAt": "2026-01-07T10:12:44Z"
    }
  }
}
```

---

## 🧪 Testing Deployment

### Using Hardhat Console

```bash
npx hardhat console --network localhost
```

```javascript
// Attach to deployed contract
const PharmaChain = await ethers.getContractFactory("PharmaChain");
const proxy = PharmaChain.attach("PROXY_ADDRESS");

// Check roles
const [deployer] = await ethers.getSigners();
const hasRole = await proxy.hasRole(await proxy.MANUFACTURER_ROLE(), deployer.address);
console.log("Has MANUFACTURER_ROLE:", hasRole);

// Create a batch
const tx = await proxy.createBatch(1000, "vials");
await tx.wait();
console.log("Batch created!");

// Get batch details
const batch = await proxy.getBatch(1);
console.log("Batch:", batch);
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use hardware wallet for mainnet** - Ledger/Trezor
3. **Test upgrades on testnet first** - Always!
4. **Verify storage layout compatibility** - Automatic in upgrade script
5. **Multi-sig for admin role** - Use Gnosis Safe for production

---

## 🐛 Troubleshooting

### "Error: Cannot find module '@openzeppelin/hardhat-upgrades'"

```bash
npm install
```

### "Error: No deployment found for network"

Deploy first:
```bash
npm run deploy:localhost
```

### MetaMask "Nonce too high" error

Reset account in MetaMask:
Settings → Advanced → Clear activity tab data

### "Proxy admin is not the one registered in the network manifest"

Delete `.openzeppelin/` folder and redeploy:
```bash
rm -rf .openzeppelin
npm run deploy:localhost
```

---

## 📚 Additional Resources

- [OpenZeppelin Upgrades Plugin](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [UUPS Pattern](https://eips.ethereum.org/EIPS/eip-1822)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Writing Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)
