import { useState } from 'react'
import { Package, Search, ShieldCheck, AlertOctagon } from 'lucide-react'
import { Input } from "@/components/ui/input"

import { Card, CardContent } from "@/components/ui/card"
import { useBatches } from '../../hooks/useBatches'
import { MedicineDetailsModal } from './MedicineDetailsModal'

export function GuestSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  
  // Real-time search from MongoDB (via backend API which is indexed)
  const { data: batchesData } = useBatches({
    // In a real app, you'd pass a search param here to filter on backend
    // For now we filter client-side or assume useBatches can accept search
  })

  // Mock filtering for demo if backend search isn't fully wired
  const filteredBatches = batchesData?.batches?.filter((batch: any) => 
    (batch.productName && batch.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (batch.batchId && batch.batchId.toString().includes(searchTerm))
  ) || []

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-br from-teal-600 to-slate-900 py-24 px-6 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <h1 className="text-5xl font-bold mb-6 tracking-tight relative z-10">PharmaChain Guest Search</h1>
        <p className="text-xl text-teal-100 max-w-2xl mx-auto mb-10 relative z-10">
          Verify the safety and authenticity of your medicine instantly. Powered by Blockchain Technology.
        </p>
        
        {/* Central Search Bar */}
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-6 h-6 text-slate-400" />
            <Input 
              className="w-full h-14 pl-14 pr-4 bg-white/95 backdrop-blur text-slate-900 border-none shadow-xl rounded-2xl text-lg placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-400"
              placeholder="Search by Medicine Name, Batch ID, or Manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container max-w-5xl mx-auto px-6 py-12 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.length > 0 ? (
            filteredBatches.map((batch: any) => (
              <Card 
                key={batch.batchId} 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden group"
                onClick={() => setSelectedBatch(batch)}
              >
                <div className={`h-2 w-full ${batch.status === 'RECALLED' ? 'bg-red-500' : 'bg-teal-500'}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-teal-600 dark:text-teal-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 transition-colors">
                      <Package className="w-8 h-8" />
                    </div>
                    {batch.status === 'RECALLED' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertOctagon className="w-3 h-3 mr-1" />
                        Recalled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified Safe
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {batch.productName || `Batch #${batch.batchId}`}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {batch.manufacturerName || 'Unknown Manufacturer'}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>ID: {batch.batchId}</span>
                    <span>Exp: {batch.expiryDate || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : searchTerm ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              <p>No products found matching "{searchTerm}"</p>
            </div>
          ) : (
             <div className="col-span-full text-center py-12 text-slate-400 opacity-50">
              <p>Start typing to search available medicines</p>
            </div>
          )}
        </div>
      </div>

      <MedicineDetailsModal 
        isOpen={!!selectedBatch} 
        onClose={() => setSelectedBatch(null)} 
        batch={selectedBatch} 
      />
    </div>
  )
}
