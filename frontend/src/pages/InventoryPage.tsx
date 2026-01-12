import { Package } from 'lucide-react'
import { useBatches } from '../hooks/useBatches'
import { ProductCard } from '../components/ProductCard'
import { useRole } from '../hooks/useRole'

export function InventoryPage() {
  const { data: batchesData, isLoading } = useBatches()
  const { isManufacturer, isDistributor } = useRole()

  const userRole = isManufacturer ? 'manufacturer' : isDistributor ? 'distributor' : 'public'
  const batches = batchesData?.batches || []

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-muted-foreground">
          View and manage all batches in the supply chain
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map(batch => (
            <ProductCard key={batch.batchId} batch={batch} userRole={userRole} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">No batches found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Batches will appear here once they are created
          </p>
        </div>
      )}
    </div>
  )
}
