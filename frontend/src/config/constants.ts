export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // Sepolia Address
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111') // Default to Sepolia
export const DEPLOYMENT_BLOCK = 10021586n // Sepolia Deployment Block

export const ROLES = {
  MANUFACTURER: '0x0000000000000000000000000000000000000000000000000000000000000001',
  DISTRIBUTOR: '0x0000000000000000000000000000000000000000000000000000000000000002',
} as const

export const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  RECALLED: 'Recalled',
}

export const POLLING_INTERVAL = 5000 // 5 seconds
