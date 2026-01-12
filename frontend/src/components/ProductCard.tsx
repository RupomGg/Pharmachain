import { Link } from 'react-router-dom'
import { Package, Eye, Send, Check, Clock, AlertTriangle } from 'lucide-react'
import type { Batch } from '../types/batch'
import { formatAddress, getStatusColor, getStatusVariant } from '../lib/utils'

interface ProductCardProps {
  batch: Batch
  userRole?: 'manufacturer' | 'distributor' | 'public'
  onSplit?: (batch: Batch) => void
  onTransfer?: (batch: Batch) => void
  onAccept?: (batchId: number) => void
}

export function ProductCard({ batch, userRole = 'public', onSplit, onTransfer, onAccept }: ProductCardProps) {
  const canSplit = userRole === 'manufacturer' && batch.status === 'CREATED'
  const canTransfer = (userRole === 'manufacturer' || userRole === 'distributor') && batch.status !== 'RECALLED'
  const canAccept = batch.pendingTransfer && userRole !== 'public'

  const statusColor = getStatusColor(batch.status)
  const statusVariant = getStatusVariant(batch.status)

  return (
    <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all">
      {/* Status Banner */}
      <div className={`h-2 ${statusColor}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5" />
              <h3 className="font-bold text-lg">Batch #{batch.batchId}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {batch.quantity} {batch.unit}
            </p>
          </div>

          {/* Status Badge */}
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${statusVariant === 'default' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
            ${statusVariant === 'secondary' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : ''}
            ${statusVariant === 'destructive' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
            ${statusVariant === 'outline' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
          `}>
            {batch.status.replace('_', ' ')}
          </span>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Manufacturer</p>
            <p className="font-mono text-xs">{formatAddress(batch.manufacturer)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Owner</p>
            <p className="font-mono text-xs">{formatAddress(batch.owner)}</p>
          </div>
        </div>

        {/* Pending Transfer Alert */}
        {batch.pendingTransfer && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Clock className="h-4 w-4" />
              <div>
                <p className="font-semibold text-sm">Transfer Pending</p>
                <p className="text-xs">To: {formatAddress(batch.pendingTransfer.to)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recalled Warning */}
        {batch.status === 'RECALLED' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4" />
              <p className="font-semibold text-sm">Product Recalled</p>
            </div>
          </div>
        )}

        {/* Metadata Preview */}
        {batch.metadata && batch.metadata.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              {batch.metadata.length} document(s) attached
            </p>
            <div className="flex gap-2 flex-wrap">
              {batch.metadata.slice(0, 3).map((meta, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs border">
                  {meta.docType}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Role-Based Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {/* Public: View Details */}
          <Link
            to={`/product/${batch.batchId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Link>

          {/* Manufacturer: Split Batch */}
          {canSplit && onSplit && (
            <button
              onClick={() => onSplit(batch)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Split
            </button>
          )}

          {/* Transfer */}
          {canTransfer && onTransfer && (
            <button
              onClick={() => onTransfer(batch)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <Send className="h-4 w-4" />
              Transfer
            </button>
          )}

          {/* Accept Transfer */}
          {canAccept && onAccept && (
            <button
              onClick={() => onAccept(batch.batchId)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Check className="h-4 w-4" />
              Accept
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
