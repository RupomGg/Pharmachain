import { ethers } from 'ethers';

/**
 * Frontend Hash Utility for PharmaChain V2
 * 
 * CRITICAL: This MUST match the backend hashUtils.js exactly
 * Field order and types must be identical for hash verification
 * 
 * @param {Object} piiData - Personal Identifiable Information
 * @returns {string} - Keccak256 hash (0x...)
 */
export function generateIdentityHash(piiData: {
  name: string;
  email: string;
  phone?: string;
  physicalAddress?: string;
  licenseNumber?: string;
}): string {
  const { name, email, phone, physicalAddress, licenseNumber } = piiData;

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
