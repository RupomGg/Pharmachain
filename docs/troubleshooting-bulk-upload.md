# 🔧 Troubleshooting: Bulk Upload Setup

## Issue: 500 Internal Server Error

The bulk upload endpoint is returning a 500 error. Here are the likely causes and solutions:

---

## ✅ **Solution 1: Restart Backend Server**

The new controller code needs to be loaded. Restart your backend:

### In your terminal running `npm run dev`:
1. Press `Ctrl + C` to stop the server
2. Run `npm run dev` again

Or use nodemon (it should auto-restart, but sometimes needs a manual restart).

---

## ⚠️ **Solution 2: Verify Pinata JWT Token**

The value you provided (`2f57859ac19afba0bcf6`) looks like an API Key, not a JWT token.

### Pinata has TWO types of credentials:

#### **Option A: JWT Token** (Recommended)
- Starts with `eyJ...`
- Very long string (hundreds of characters)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI...`

#### **Option B: API Key + Secret**
- API Key: Short string (like `2f57859ac19afba0bcf6`)
- API Secret: Another string
- Requires different code

### How to Get JWT Token from Pinata:

1. Go to https://app.pinata.cloud/developers/api-keys
2. Click "New Key"
3. Give it a name (e.g., "PharmaChain Bulk Upload")
4. Enable permissions:
   - ✅ `pinFileToIPFS`
   - ✅ `pinJSONToIPFS`
5. Click "Create Key"
6. **Copy the JWT token** (starts with `eyJ...`)
7. Update `backend/.env`:
   ```bash
   PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_jwt_token_here...
   ```

---

## 🔄 **Solution 3: Alternative - Use API Key/Secret**

If you only have API Key and Secret, update the controller code:

### Update `backend/src/controllers/batchController.js`:

Replace the `uploadToPinata` function:

```javascript
async function uploadToPinata(metadata) {
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
  
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('PINATA_API_KEY and PINATA_SECRET_KEY must be set');
  }

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `Batch-${metadata.properties.manufacturerBatch}.json`
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinata upload failed: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Pinata upload error:', error);
    throw error;
  }
}
```

### Update `backend/.env`:

```bash
# Pinata (IPFS) - API Key Method
PINATA_API_KEY=2f57859ac19afba0bcf6
PINATA_SECRET_KEY=your_secret_key_here
```

---

## 🧪 **Solution 4: Test with Mock Data First**

To verify the endpoint works without Pinata, temporarily modify the controller:

### In `batchController.js`, replace `uploadToPinata` with:

```javascript
async function uploadToPinata(metadata) {
  // TEMPORARY: Mock IPFS upload for testing
  console.log('Mock upload:', metadata.properties.manufacturerBatch);
  return `QmMock${Math.random().toString(36).substring(7)}`; // Fake CID
}
```

This will test if the CSV parsing and validation work correctly.

---

## 📝 **Checklist**

- [ ] Restart backend server (`Ctrl+C` then `npm run dev`)
- [ ] Verify Pinata credentials are correct
- [ ] Check if using JWT (starts with `eyJ`) or API Key/Secret
- [ ] Update `.env` with correct credentials
- [ ] Test again with `powershell -ExecutionPolicy Bypass -File test-bulk-upload.ps1`

---

## 🔍 **Debug: Check Backend Logs**

After restarting, check the terminal running `npm run dev` for error messages. Common errors:

| Error | Cause | Fix |
|-------|-------|-----|
| `PINATA_JWT is not set` | Missing env var | Add to `.env` |
| `Pinata upload failed: 401` | Invalid credentials | Check JWT/API key |
| `Pinata upload failed: 429` | Rate limit | Wait or upgrade plan |
| `Cannot find module` | Missing dependency | Run `npm install` |

---

## ✅ **Expected Success Response**

When working correctly, you should see:

```json
{
  "success": true,
  "message": "Successfully processed 10 batches",
  "count": 10,
  "batches": [
    {
      "batchNumber": "BN-101",
      "ipfsHash": "QmHash123...",
      "quantity": 1000,
      "unit": "Box"
    }
  ],
  "contractData": {
    "quantities": [1000, 2000, ...],
    "units": ["Box", "Bottle", ...],
    "ipfsHashes": ["QmHash1...", ...],
    "manufacturerBatchNumbers": ["BN-101", ...]
  }
}
```

---

## 📞 **Still Having Issues?**

1. Check backend console for detailed error messages
2. Verify all dependencies are installed: `npm install`
3. Check MongoDB is running
4. Verify the CSV file exists at `docs/sample-batches.csv`

---

**Next Step**: Restart your backend server and try again!
