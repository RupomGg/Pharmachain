import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import PharmaChainV2Artifact from '../config/PharmaChainV2.json';
const pharmaChainABI = PharmaChainV2Artifact.abi;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface BulkBatchData {
  batchNumber: string;
  productName: string;
  dosageStrength: string;
  quantity: number;
  unit: string;
  ipfsHash: string;
  expiryDate: string;
  // New fields
  metadata?: any;
  baseUnitPrice?: number;
  totalUnitsPerPack?: number;
  baseUnitCost?: number;
  productImage?: string;
  packComposition?: string;
}

interface ContractData {
  quantities: number[];
  units: string[];
  ipfsHashes: string[];
  manufacturerBatchNumbers: string[];
}

interface UploadResponse {
  success: boolean;
  message?: string;
  count?: number;
  batches?: BulkBatchData[];
  contractData?: ContractData;
  error?: string;
  errors?: any[];
}

export function useBulkBatchImport(contractAddress: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedBatches, setUploadedBatches] = useState<BulkBatchData[]>([]);
  const [contractData, setContractData] = useState<ContractData | null>(null);

  // Smart contract write hook
  const { writeContractAsync, data: hash, error: contractError, isPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Step 1: Upload CSV file to backend
   * Backend parses CSV and uploads metadata to IPFS via Pinata
   */
  const uploadCSV = async (file: File): Promise<UploadResponse> => {
    setIsUploading(true);
    setUploadError(null);
    setUploadedBatches([]);
    setContractData(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch(`${API_URL}/batches/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload CSV');
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // Store the uploaded batches and contract data
      setUploadedBatches(data.batches || []);
      setContractData(data.contractData || null);

      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload CSV';
      setUploadError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Step 2: Mint batches on blockchain
   * Uses the contract data returned from uploadCSV
   */
  const mintBatches = async (data?: ContractData) => {
    const dataToUse = data || contractData;

    if (!dataToUse) {
      throw new Error('No contract data available. Please upload CSV first.');
    }

    try {
      const batchCount = dataToUse.quantities.length;
      
      // Use different function based on batch count
      if (batchCount === 1) {
        // Single batch - use createBatchWithMetadata
        await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: pharmaChainABI,
          functionName: 'createBatchWithMetadata',
          args: [
            dataToUse.quantities[0],
            dataToUse.units[0],
            dataToUse.ipfsHashes[0],
          ],
        });
      } else {
        // Multiple batches - use createBatchesBulk
        await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: pharmaChainABI,
          functionName: 'createBatchesBulk',
          args: [
            dataToUse.quantities,
            dataToUse.units,
            dataToUse.ipfsHashes,
            dataToUse.manufacturerBatchNumbers,
          ],
        });
      }
    } catch (error: any) {
      console.error('Minting error:', error);
      throw error;
    }
  };

  /**
   * Combined function: Upload CSV and mint in one call
   */
  const uploadAndMint = async (file: File) => {
    try {
      // Step 1: Upload CSV and get IPFS hashes
      const uploadResult = await uploadCSV(file);

      if (!uploadResult.contractData) {
        throw new Error('No contract data returned from upload');
      }

      // Step 2: Mint batches on blockchain
      await mintBatches(uploadResult.contractData);

      return uploadResult;
    } catch (error: any) {
      console.error('Upload and mint error:', error);
      throw error;
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setIsUploading(false);
    setUploadError(null);
    setUploadedBatches([]);
    setContractData(null);
  };

  /**
   * Upload Manual JSON Data to backend
   * Backend processes JSON and uploads metadata to IPFS
   */
  const uploadManualBatches = async (batches: any[], walletAddress: string): Promise<UploadResponse> => {
     setIsUploading(true);
     setUploadError(null);
     setUploadedBatches([]);
     setContractData(null);
 
     try {
       // Use fetch directly or API client; let's stick to fetch for consistency within this file's pattern
       // Actually, we need to pass headers.
       
       const response = await fetch(`${API_URL}/batches/manual`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': walletAddress
         },
         body: JSON.stringify({ batches }),
       });
 
       const data: UploadResponse = await response.json();
 
       if (!response.ok) {
         throw new Error(data.error || 'Failed to process manual batches');
       }
 
       if (!data.success) {
         throw new Error(data.error || 'Processing failed');
       }
 
       setUploadedBatches(data.batches || []);
       setContractData(data.contractData || null);
 
       return data;
     } catch (error: any) {
       const errorMessage = error.message || 'Failed to process manual batches';
       setUploadError(errorMessage);
       throw error;
     } finally {
       setIsUploading(false);
     }
  };

  return {
    // Upload functions
    uploadCSV,
    uploadManualBatches,
    mintBatches,
    uploadAndMint,
    reset,
    setUploadedBatches, // Exposed for external manipulation if needed

    // Upload state
    isUploading,
    uploadError,
    uploadedBatches,
    contractData,

    // Contract state
    isPending,
    isConfirming,
    isConfirmed,
    contractError,
    transactionHash: hash,

    // Combined loading state
    isProcessing: isUploading || isPending || isConfirming,
  };
}
