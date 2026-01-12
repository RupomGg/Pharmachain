export interface Batch {
  _id: number
  batchId: number
  manufacturerBatchNo?: string // Present in Mongoose model
  productName?: string         // Present in Mongoose model
  dosageStrength?: string      // Present in Mongoose model
  expiryDate?: string          // Present in Mongoose model
  parentBatchId: number
  quantity: number
  unit: string
  owner: string
  manufacturer: string
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'RECALLED'
  metadata: MetadataEntry[]
  createdAt: string
  updatedAt: string
  blockNumber: number
  transactionHash: string
  pendingTransfer?: {
    to: string
    initiatedAt: string
  }
}

export interface MetadataEntry {
  docType: string
  ipfsHash: string
  timestamp: string
}

export interface TraceabilityData {
  batch: Batch
  upstream: {
    count: number
    maxDepth: number
    batches: Batch[]
  }
  downstream: {
    count: number
    maxDepth: number
    batches: Batch[]
  }
}

export interface EventLog {
  _id: string
  eventName: string
  args: Record<string, any>
  blockNumber: number
  transactionHash: string
  logIndex: number
  timestamp: string
}

export interface BatchesResponse {
  batches: Batch[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
