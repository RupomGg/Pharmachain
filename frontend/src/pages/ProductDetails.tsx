import { useParams, Link } from 'react-router-dom'
import { Package, ArrowLeft, CheckCircle, AlertTriangle, Clock, User, Calendar, Hash } from 'lucide-react'
import { useBatch } from '../hooks/useBatches'
import { formatAddress, formatDate, getStatusColor } from '../lib/utils'

export function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const batchId = id ? parseInt(id) : undefined

  const { data: batch, isLoading, error } = useBatch(batchId)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  if (error || !batch) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Batch Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The batch you're looking for doesn't exist or hasn't been synced yet.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  const isRecalled = batch.status === 'RECALLED'
  const statusColor = getStatusColor(batch.status)

  return (
    <div className="container mx-auto p-6">
      {/* Back Button */}
      <Link
        to="/search"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Package className="w-10 h-10" />
              Batch #{batch.batchId}
            </h1>
            <p className="text-xl text-muted-foreground">
              {batch.quantity} {batch.unit}
            </p>
          </div>

          {/* Status Badge */}
          {isRecalled ? (
            <div className="bg-red-100 dark:bg-red-950 border-2 border-red-500 text-red-800 dark:text-red-200 px-6 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              <span className="font-bold text-lg">RECALLED</span>
            </div>
          ) : (
            <div className={`${statusColor} bg-opacity-10 border-2 px-6 py-3 rounded-lg flex items-center gap-2`}>
              <CheckCircle className="w-6 h-6" />
              <span className="font-bold text-lg">{batch.status.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className={`h-2 ${statusColor} rounded-full`} />
      </div>

      {/* Recalled Warning */}
      {isRecalled && (
        <div className="mb-6 p-6 bg-red-50 dark:bg-red-950 border-2 border-red-500 rounded-lg">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                WARNING: This Product Has Been Recalled
              </h3>
              <p className="text-red-700 dark:text-red-300">
                This batch has been recalled and should not be used or distributed. 
                Please contact the manufacturer for further instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Supply Chain Info */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Supply Chain Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Manufacturer</p>
                <p className="font-mono text-sm">{batch.manufacturer}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Current Owner</p>
                <p className="font-mono text-sm">{batch.owner}</p>
              </div>
            </div>

            {batch.parentBatchId > 0 && (
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Parent Batch</p>
                  <Link
                    to={`/product/${batch.parentBatchId}`}
                    className="text-primary-500 hover:underline"
                  >
                    Batch #{batch.parentBatchId}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Info */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Blockchain Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Transaction Hash</p>
                <p className="font-mono text-xs break-all">{batch.transactionHash}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Block Number</p>
                <p className="font-mono">{batch.blockNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p>{formatDate(batch.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Transfer */}
      {batch.pendingTransfer && (
        <div className="mb-6 p-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
                Transfer Pending
              </h3>
              <p className="text-amber-700 dark:text-amber-300">
                This batch is being transferred to: {formatAddress(batch.pendingTransfer.to)}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Initiated: {formatDate(batch.pendingTransfer.initiatedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      {batch.metadata && batch.metadata.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Attached Documents</h2>
          <div className="space-y-3">
            {batch.metadata.map((meta, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                <div>
                  <p className="font-medium">{meta.docType}</p>
                  <p className="text-sm text-muted-foreground font-mono">{meta.ipfsHash}</p>
                </div>
                <a
                  href={`https://ipfs.io/ipfs/${meta.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:underline text-sm"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Traceability */}
      <div className="mt-8 text-center">
        <Link
          to={`/traceability?batch=${batch.batchId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          View Full Supply Chain
        </Link>
      </div>
    </div>
  )
}
