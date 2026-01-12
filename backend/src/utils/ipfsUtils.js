import fetch from 'node-fetch';

/**
 * Upload batch metadata to Pinata (IPFS)
 * Filters out private fields before uploading.
 * @param {Object} data - The raw batch data to check and upload
 * @returns {Promise<string>} - The IPFS CID (hash)
 */
export async function uploadToIpfs(data) {
  const PINATA_JWT = process.env.PINATA_JWT;
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  // Choose authentication method
  if (PINATA_JWT) {
    headers['Authorization'] = `Bearer ${PINATA_JWT}`;
  } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    headers['pinata_api_key'] = PINATA_API_KEY;
    headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
  } else {
    throw new Error('Pinata configuration missing. Please set either PINATA_JWT or (PINATA_API_KEY and PINATA_SECRET_KEY) in .env');
  }

  // filter payload to ensure NO private data (quantity, price, cost)
  const publicPayload = {
    name: data.productName,
    description: `${data.dosageStrength || ''} - Batch ${data.batchNumber}`,
    image: data.productImage || '',
    attributes: [
        { trait_type: 'Manufacturer', value: data.manufacturer || '' },
        { trait_type: 'Expiry', value: data.expiryDate || '' },
        { trait_type: 'Strength', value: data.dosageStrength || '' },
        { trait_type: 'Packing', value: data.packingType || '' },
        { trait_type: 'Ingredients', value: data.ingredients || '' },
        { trait_type: 'Storage', value: data.storageTemp || '' }
    ]
  };

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        pinataContent: publicPayload,
        pinataMetadata: {
          name: `Batch-${data.batchNumber}-${Date.now()}.json`
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinata upload failed: ${error.error || response.statusText}`);
    }

    const resData = await response.json();
    return resData.IpfsHash; // Returns the CID
  } catch (error) {
    console.error('Pinata upload error:', error);
    throw error;
  }
}
