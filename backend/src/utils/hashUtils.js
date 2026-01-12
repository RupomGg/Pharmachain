import { ethers } from 'ethers';

/**
 * Generate Identity Hash for PharmaChain V2
 * 
 * This hash is used for on-chain identity verification.
 * CRITICAL: The field order and types MUST match exactly between:
 * - User registration (backend)
 * - Admin approval (frontend)
 * - Smart contract verification
 * 
 * @param {Object} piiData - Personal Identifiable Information
 * @param {string} piiData.name - Full legal/company name
 * @param {string} piiData.email - Email address
 * @param {string} piiData.phone - Phone number
 * @param {string} piiData.physicalAddress - Physical address
 * @param {string} piiData.licenseNumber - Business/medical license number
 * @returns {string} - Keccak256 hash (0x...)
 */
export function generateIdentityHash(piiData) {
  const { name, email, phone, physicalAddress, licenseNumber } = piiData;

  // Validate required fields
  if (!name || !email) {
    throw new Error('Name and email are required for identity hash generation');
  }

  // Use solidityPackedKeccak256 for consistency with Solidity
  // Field order: name, email, phone, physicalAddress, licenseNumber
  const hash = ethers.solidityPackedKeccak256(
    ['string', 'string', 'string', 'string', 'string'],
    [
      name || '',
      email || '',
      phone || '',
      physicalAddress || '',
      licenseNumber || ''
    ]
  );

  return hash;
}

/**
 * Verify if a given hash matches the PII data
 * 
 * @param {Object} piiData - PII data to verify
 * @param {string} expectedHash - Hash to compare against
 * @returns {boolean} - True if hash matches
 */
export function verifyIdentityHash(piiData, expectedHash) {
  const computedHash = generateIdentityHash(piiData);
  return computedHash.toLowerCase() === expectedHash.toLowerCase();
}
