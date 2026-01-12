# Bulk Batch Import System - Complete Guide

## Overview

The bulk import system allows manufacturers to upload a CSV file containing multiple medicine batches, automatically create IPFS metadata for each batch, and mint them all on the blockchain in a single transaction.

---

## System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌────────────────┐
│   CSV File  │─────▶│   Backend    │─────▶│   Pinata    │─────▶│   Blockchain   │
│             │      │   (Node.js)  │      │   (IPFS)    │      │  (Smart        │
│             │      │              │      │             │      │   Contract)    │
└─────────────┘      └──────────────┘      └─────────────┘      └────────────────┘
     Upload           Parse & Validate      Upload Metadata       Mint Batches
```

### Flow:

1. **Frontend**: User uploads CSV file
2. **Backend**: Parses CSV, validates data
3. **Backend**: Uploads metadata to IPFS via Pinata (parallel, rate-limited)
4. **Backend**: Returns IPFS hashes and contract data
5. **Frontend**: Calls smart contract `createBatchesBulk()`
6. **Blockchain**: Mints all batches in one transaction
7. **Backend**: Event listener indexes the new batches

---

## CSV Format

### Required Columns (Strict Order)

| Column | Type | Description | Privacy |
|--------|------|-------------|---------|
| `batchNumber` | String | Manufacturer's Box/Lot ID | Public |
| `productName` | String | Commercial name of medicine | Public |
| `dosageStrength` | String | Strength per unit | Public |
| `packingType` | String | Unit of Measure (Box, Bottle) | Public |
| `quantity` | Integer | Physical count | Public |
| `expiryDate` | Date | YYYY-MM-DD format | Public |
| `ingredients` | String | Active ingredients separated by `;` | Public |
| `storageTemp` | String | Recommended storage temp | Public |
| `productImage` | String | Public URL of image | Public |
| `packComposition` | String | e.g. "5 Strips x 4 Caps" | Public |
| `totalUnitsPerPack` | Integer | Total units per pack | Public |
| `baseUnitCost` | Decimal | Private Cost (Manuf. only) | **Private** |
| `baseUnitPrice` | Decimal | Private Price (Distributor) | **Private** |

### Sample CSV Row

```csv
batchNumber,productName,dosageStrength,packingType,quantity,expiryDate,ingredients,storageTemp,productImage,packComposition,totalUnitsPerPack,baseUnitCost,baseUnitPrice
BN-2024-X01,Panadol Advance,500mg,Box,1000,2026-12-31,"Paracetamol;Caffeine",25C,https://img.com/p.jpg,"5 Strips x 4 Caps",20,5.50,8.99
```

### Validation Rules

✅ **Required Fields**: All 13 columns must be present (or empty string for optional strings)
✅ **Private Data**: `baseUnitCost` and `baseUnitPrice` are **NEVER** uploaded to IPFS
✅ **Calculated Fields**: Backend calculates `totalBatchValue` automatically
✅ **Images**: Must be valid public URLs
✅ **Batch Limit**: Maximum 50 batches per CSV  

---

## Backend Implementation

### 1. Controller (`batchController.js`)

```javascript
// POST /api/batches/upload-csv
export const uploadBulkBatchCSV = async (req, res) => {
  // 1. Validate file upload
  // 2. Parse CSV using fast-csv
  // 3. Validate each row
  // 4. Check for duplicates
  // 5. Upload metadata to Pinata (parallel with p-limit)
  // 6. Return contract data to frontend
}
```

**Key Features**:
- ✅ CSV parsing with `fast-csv`
- ✅ Parallel IPFS uploads with `p-limit` (max 5 concurrent)
- ✅ Comprehensive validation
- ✅ Duplicate detection
- ✅ Error handling with detailed messages

### 2. IPFS Upload (Pinata)

```javascript
async function uploadToPinata(metadata) {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PINATA_JWT}`
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `Batch-${metadata.properties.manufacturerBatch}.json`
      }
    })
  });
  
  const data = await response.json();
  return data.IpfsHash; // CID
}
```

**Metadata Structure**:
```json
{
  "name": "Panadol",
  "description": "500mg - Batch BN-101",
  "properties": {
    "strength": "500mg",
    "expiry": "2026-12-31",
    "manufacturerBatch": "BN-101",
    "packingType": "Box",
    "quantity": 1000
  }
}
```

### 3. Database Schema Updates

```javascript
// Batch.js model additions
manufacturerBatchNo: {
  type: String,
  index: true,
  unique: true,
  sparse: true,
  description: 'Manufacturer\'s internal batch number (e.g., BN-101)'
},
ipfsHash: {
  type: String,
  description: 'IPFS CID of the batch metadata JSON'
},
dosageStrength: { type: String },
packingType: { type: String }
```

---

## Frontend Implementation

### 1. React Hook (`useBulkBatchImport.ts`)

```typescript
export function useBulkBatchImport(contractAddress: string) {
  // Upload CSV to backend
  const uploadCSV = async (file: File) => { ... }
  
  // Mint batches on blockchain
  const mintBatches = async (data?: ContractData) => { ... }
  
  // Combined: Upload + Mint
  const uploadAndMint = async (file: File) => { ... }
  
  return {
    uploadCSV,
    mintBatches,
    uploadAndMint,
    isUploading,
    uploadError,
    uploadedBatches,
    contractData,
    isPending,
    isConfirming,
    isConfirmed,
    transactionHash
  };
}
```

### 2. Component Usage

```tsx
import { useBulkBatchImport } from '../hooks/useBulkBatchImport';

function BulkImportPage() {
  const {
    uploadCSV,
    mintBatches,
    uploadAndMint,
    isProcessing,
    uploadedBatches,
    isConfirmed
  } = useBulkBatchImport(CONTRACT_ADDRESS);

  const handleFileUpload = async (file: File) => {
    try {
      // Option 1: Two-step process
      await uploadCSV(file);
      // ... show preview ...
      await mintBatches();
      
      // Option 2: One-click process
      await uploadAndMint(file);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={(e) => {
        if (e.target.files?.[0]) {
          handleFileUpload(e.target.files[0]);
        }
      }} />
      {/* ... UI ... */}
    </div>
  );
}
```

---

## API Endpoints

### POST `/api/batches/upload-csv`

**Request**:
```
Content-Type: multipart/form-data
Body: csvFile (File)
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Successfully processed 3 batches",
  "count": 3,
  "batches": [
    {
      "batchNumber": "BN-101",
      "productName": "Panadol",
      "dosageStrength": "500mg",
      "quantity": 1000,
      "unit": "Box",
      "ipfsHash": "QmHash123...",
      "expiryDate": "2026-12-31"
    }
  ],
  "contractData": {
    "quantities": [1000, 2000, 1500],
    "units": ["Box", "Box", "Vial"],
    "ipfsHashes": ["QmHash1...", "QmHash2...", "QmHash3..."],
    "manufacturerBatchNumbers": ["BN-101", "BN-102", "BN-103"]
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "CSV validation failed",
  "errors": [
    {
      "row": 2,
      "error": "Missing required fields: quantity",
      "data": { ... }
    }
  ]
}
```

### GET `/api/batches/by-manufacturer-number/:batchNumber`

**Response**:
```json
{
  "success": true,
  "batch": {
    "_id": 1,
    "manufacturerBatchNo": "BN-101",
    "ipfsHash": "QmHash123...",
    "productName": "Panadol",
    "quantity": 1000,
    "unit": "Box",
    "owner": "0x123...",
    "status": "CREATED"
  }
}
```

---

## Environment Variables

### Backend (`.env`)

```bash
# Pinata Configuration
PINATA_JWT=your_pinata_jwt_token_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/pharmachain

# API Configuration
PORT=5000
```

### Frontend (`.env`)

```bash
# API URL
VITE_API_URL=http://localhost:5000/api

# Contract Address
VITE_CONTRACT_ADDRESS=0x...
```

---

## Installation

### Backend Dependencies

```bash
cd backend
npm install fast-csv p-limit
```

### Frontend Dependencies

Already included in wagmi/viem setup.

---

## Testing

### 1. Test CSV Upload

```bash
curl -X POST http://localhost:5000/api/batches/upload-csv \
  -F "csvFile=@sample-batches.csv"
```

### 2. Test with Sample Data

Create `test-batches.csv`:
```csv
batchNumber,productName,dosageStrength,packingType,quantity,expiryDate
TEST-001,Test Medicine A,100mg,Box,500,2026-12-31
TEST-002,Test Medicine B,200mg,Bottle,1000,2027-06-30
TEST-003,Test Medicine C,50mg,Box,750,2026-09-15
```

### 3. Verify IPFS Upload

After upload, check Pinata dashboard:
- Go to https://app.pinata.cloud/pinmanager
- Verify JSON files are uploaded
- Check CIDs match response

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `No CSV file uploaded` | File not attached | Ensure `csvFile` field name matches |
| `Invalid file type` | Not a CSV file | Upload `.csv` file only |
| `Missing required fields` | CSV missing columns | Check CSV format |
| `Quantity must be positive` | Quantity ≤ 0 | Fix quantity values |
| `Duplicate batch numbers` | Batch number exists | Use unique batch numbers |
| `Too many batches` | > 50 batches | Split into multiple files |
| `Pinata upload failed` | Invalid JWT or rate limit | Check `PINATA_JWT` env var |

---

## Gas Optimization

### Batch Size Recommendations

| Batches | Gas Cost | USD Cost (1.2 Gwei) | Recommendation |
|---------|----------|---------------------|----------------|
| 1-10 | ~800K | ~$3 | Good for testing |
| 11-25 | ~1.8M | ~$7 | Balanced |
| 26-50 | ~3.5M | ~$13 | **Optimal** |

**Best Practice**: Upload 50 batches per transaction for maximum efficiency.

---

## Security Considerations

1. **File Upload**: Limited to 5MB, CSV only
2. **Rate Limiting**: Applied to all endpoints
3. **Validation**: Comprehensive server-side validation
4. **IPFS**: Metadata is immutable once uploaded
5. **Blockchain**: Batches are immutable after minting
6. **Duplicate Prevention**: Database checks before upload

---

## Monitoring

### Backend Logs

```javascript
console.log(`Processing ${batches.length} batches for IPFS upload...`);
console.log(`✓ Uploaded ${batch.batchNumber} to IPFS: ${ipfsHash}`);
console.log(`✓ Successfully uploaded ${uploadedBatches.length} batches to IPFS`);
```

### Event Listener

The existing event listener will automatically index `BulkBatchCreated` events and update the database with blockchain IDs.

---

## Troubleshooting

### Issue: IPFS Upload Fails

**Check**:
1. `PINATA_JWT` is set correctly
2. Pinata account has sufficient storage
3. Network connection is stable

### Issue: Transaction Fails

**Check**:
1. Wallet has sufficient ETH for gas
2. Batch count ≤ 50
3. All IPFS hashes are valid
4. Manufacturer role is granted

### Issue: Duplicate Batch Numbers

**Solution**:
```bash
# Check existing batch numbers
curl http://localhost:5000/api/batches/by-manufacturer-number/BN-101
```

---

## Next Steps

1. ✅ Install dependencies: `npm install fast-csv p-limit`
2. ✅ Set up Pinata account and get JWT token
3. ✅ Add `PINATA_JWT` to `.env`
4. ✅ Test with sample CSV
5. ✅ Integrate `BulkBatchImport` component into your app
6. ✅ Deploy and test on testnet

---

## Support

For issues or questions:
- Backend: Check `batchController.js`
- Frontend: Check `useBulkBatchImport.ts`
- Smart Contract: Check `PharmaChainV2.sol`

**Documentation**: This file  
**Version**: 1.0.0  
**Last Updated**: January 8, 2026
