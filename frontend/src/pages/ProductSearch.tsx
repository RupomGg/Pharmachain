import { useState, useMemo } from 'react'
import { Package, Search } from 'lucide-react'
import { useRole } from '../hooks/useRole'
import { useBatches } from '../hooks/useBatches'
import { ProductCard } from '../components/ProductCard'

export function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { isManufacturer, isDistributor } = useRole()

  const { data: batchesData, isLoading, error } = useBatches({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const userRole = isManufacturer ? 'manufacturer' : isDistributor ? 'distributor' : 'public'

  const filteredBatches = useMemo(() => {
    if (!batchesData?.batches) return []
    return batchesData.batches.filter(batch =>
      batch.batchId.toString().includes(searchTerm) ||
      batch.unit.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [batchesData, searchTerm])

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Batches</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load batch data'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Search</h1>
        <p className="text-muted-foreground">
          Search and filter batches in the supply chain
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Batch ID or Unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="CREATED">Created</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RECALLED">Recalled</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map(batch => (
            <ProductCard key={batch.batchId} batch={batch} userRole={userRole} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">No products found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  )
}
