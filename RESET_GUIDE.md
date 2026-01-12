# Complete System Reset Guide

This guide will help you reset the entire PharmaChain system to start fresh.

## Quick Reset (Recommended)

Run this single command:

```bash
cd backend
node src/resetSystem.js
```

Then follow the on-screen instructions.

---

## Manual Reset Steps

### 1. MongoDB Reset

Clear all data from MongoDB:

```bash
# Option A: Using the reset script
node src/resetSystem.js

# Option B: Manual MongoDB commands
mongosh mongodb://localhost:27017/pharmachain
db.dropDatabase()
exit
```

### 2. Blockchain Reset

Restart Hardhat node to reset the blockchain:

```bash
# Stop the current Hardhat node (Ctrl+C)

# Restart Hardhat node
npx hardhat node

# In a new terminal, redeploy the contract
npx hardhat run scripts/deploy.js --network localhost
```

**Important**: After redeploying, update the `CONTRACT_ADDRESS` in:
- `backend/.env`
- `frontend/.env`

The new address will be shown in the deployment output.

### 3. Update Environment Variables

Update both `.env` files with the new contract address:

**backend/.env**:
```
CONTRACT_ADDRESS=0x... (new address from deployment)
```

**frontend/.env**:
```
VITE_CONTRACT_ADDRESS=0x... (new address from deployment)
```

### 4. Restart Services

Restart all running services:

```bash
# Stop all services (Ctrl+C in each terminal)

# Restart backend API
cd backend
npm run dev

# Restart event listener worker
cd backend
node src/workerSimple.js

# Frontend will auto-reload
```

### 5. Grant Roles

After redeploying, grant the MANUFACTURER_ROLE to your account:

```bash
cd backend
node src/grantRole.js
```

This grants the role to account `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Hardhat account #1).

### 6. Pinata/IPFS (Optional)

**Note**: Files uploaded to IPFS are permanent and cannot be deleted from the network.

To clean up your Pinata account:
1. Go to https://app.pinata.cloud/pinmanager
2. Manually delete unwanted files
3. This only removes them from your Pinata account, not from IPFS

---

## Verification

After reset, verify everything is working:

1. **MongoDB**: Should be empty
   ```bash
   mongosh mongodb://localhost:27017/pharmachain
   show collections  # Should show no collections or empty collections
   ```

2. **Blockchain**: Should be at block 0 (or deployment block)
   ```bash
   # Check current block in Hardhat terminal
   # Should show low block numbers
   ```

3. **Create Test Batch**: Try creating a batch through the frontend
   - Should upload to Pinata ✅
   - Should create on blockchain ✅
   - Should appear in MongoDB within 5-10 seconds ✅

---

## Troubleshooting

### Contract Address Mismatch
If you see "contract not found" errors:
- Verify CONTRACT_ADDRESS matches in both `.env` files
- Ensure you redeployed the contract after restarting Hardhat

### Events Not Processing
If batches don't appear in MongoDB:
- Check event listener worker is running
- Verify CONTRACT_ADDRESS is correct
- Check worker logs for errors

### Role Errors
If you get "missing role" errors:
- Run `node src/grantRole.js` to grant MANUFACTURER_ROLE
- Verify the address in grantRole.js matches your MetaMask account

---

## What Gets Reset

| System | What's Cleared | How |
|--------|---------------|-----|
| **MongoDB** | All batches, users, events, sync states | `resetSystem.js` or `db.dropDatabase()` |
| **Blockchain** | All transactions, blocks, contract state | Restart Hardhat node |
| **Pinata** | Nothing (files remain on IPFS) | Manual deletion from dashboard |

---

## Quick Reference

**Reset MongoDB**:
```bash
node src/resetSystem.js
```

**Reset Blockchain**:
```bash
# Ctrl+C to stop Hardhat
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

**Update .env files** with new CONTRACT_ADDRESS

**Restart services**:
```bash
npm run dev  # Backend
node src/workerSimple.js  # Worker
# Frontend auto-reloads
```

**Grant roles**:
```bash
node src/grantRole.js
```

---

## Notes

- **Hardhat resets automatically** when you stop and restart the node
- **MongoDB requires manual clearing** (use the reset script)
- **Pinata files are permanent** on IPFS (can only unpin from your account)
- **Always update CONTRACT_ADDRESS** after redeploying
- **Always restart all services** after reset

---

Your system is now completely reset and ready for fresh data! 🚀
