# Bulk Import - Quick Reference Card

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install fast-csv p-limit
```

### 2. Set Environment Variable

Add to `backend/.env`:
```bash
PINATA_JWT=your_pinata_jwt_token_here
```

### 3. Import Component

```tsx
import { BulkBatchImport } from '../components/BulkBatchImport';

function ManufacturerDashboard() {
  return <BulkBatchImport />;
}
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `backend/src/controllers/batchController.js` | CSV parsing & Pinata upload logic |
| `backend/src/models/Batch.js` | Updated schema with `manufacturerBatchNo` & `ipfsHash` |
| `backend/src/routes/batches.js` | Added `/upload-csv` endpoint |
| `frontend/src/hooks/useBulkBatchImport.ts` | React hook for upload & minting |
| `frontend/src/components/BulkBatchImport.tsx` | Complete UI component |
| `docs/bulk-import-guide.md` | Full documentation |
| `docs/sample-batches.csv` | Sample CSV template |

---

## 🔧 API Endpoints

### Upload CSV
```bash
POST /api/batches/upload-csv
Content-Type: multipart/form-data
Body: csvFile (File)
```

### Query by Batch Number
```bash
GET /api/batches/by-manufacturer-number/:batchNumber
```

---

## 📊 CSV Format

```csv
batchNumber,productName,dosageStrength,packingType,quantity,expiryDate
BN-101,Panadol,500mg,Box,1000,2026-12-31
BN-102,Aspirin,100mg,Bottle,2000,2027-06-30
```

**Rules**:
- ✅ Max 50 batches per file
- ✅ Expiry date: `YYYY-MM-DD`
- ✅ Quantity: Positive integer
- ✅ Unique batch numbers

---

## 💻 Frontend Usage

### Option 1: Two-Step Process

```tsx
const { uploadCSV, mintBatches, uploadedBatches } = useBulkBatchImport(CONTRACT_ADDRESS);

// Step 1: Upload CSV
await uploadCSV(file);

// Step 2: Review and mint
await mintBatches();
```

### Option 2: One-Click

```tsx
const { uploadAndMint } = useBulkBatchImport(CONTRACT_ADDRESS);

await uploadAndMint(file);
```

---

## 🔐 Environment Variables

### Backend
```bash
PINATA_JWT=your_jwt_token
MONGODB_URI=mongodb://localhost:27017/pharmachain
PORT=5000
```

### Frontend
```bash
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=0x...
```

---

## 🧪 Testing

### 1. Test Upload
```bash
curl -X POST http://localhost:5000/api/batches/upload-csv \
  -F "csvFile=@docs/sample-batches.csv"
```

### 2. Verify Response
```json
{
  "success": true,
  "count": 10,
  "contractData": {
    "quantities": [1000, 2000, ...],
    "units": ["Box", "Bottle", ...],
    "ipfsHashes": ["QmHash1...", "QmHash2...", ...],
    "manufacturerBatchNumbers": ["BN-101", "BN-102", ...]
  }
}
```

---

## ⚡ Gas Costs

| Batches | Gas | USD (1.2 Gwei) |
|---------|-----|----------------|
| 10 | 800K | $3.03 |
| 25 | 1.8M | $6.81 |
| 50 | 3.5M | $13.24 |

---

## 🐛 Common Errors

| Error | Fix |
|-------|-----|
| `No CSV file uploaded` | Check form field name is `csvFile` |
| `Pinata upload failed` | Verify `PINATA_JWT` is set |
| `Duplicate batch numbers` | Use unique batch numbers |
| `Too many batches` | Max 50 per file |

---

## 📝 Metadata Structure

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

---

## 🎯 Key Features

✅ **CSV Parsing** - Validates all fields  
✅ **Parallel IPFS Upload** - Max 5 concurrent (rate-limited)  
✅ **Duplicate Detection** - Checks database before upload  
✅ **Progress Tracking** - Real-time upload/mint status  
✅ **Error Handling** - Detailed error messages  
✅ **Gas Optimization** - 53% cheaper than individual minting  

---

## 📞 Support

- **Backend**: [`batchController.js`](file:///d:/Protfolio%20Project/aphelion-mariner/backend/src/controllers/batchController.js)
- **Frontend**: [`useBulkBatchImport.ts`](file:///d:/Protfolio%20Project/aphelion-mariner/frontend/src/hooks/useBulkBatchImport.ts)
- **Contract**: [`PharmaChainV2.sol`](file:///d:/Protfolio%20Project/aphelion-mariner/contracts/PharmaChainV2.sol)
- **Full Guide**: [`bulk-import-guide.md`](file:///d:/Protfolio%20Project/aphelion-mariner/docs/bulk-import-guide.md)

---

**Version**: 1.0.0  
**Last Updated**: January 8, 2026
