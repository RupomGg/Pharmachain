
import { useState, useEffect } from 'react'
import { batchApi } from '../lib/api'
import { useAccount } from 'wagmi'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../components/ui/table'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '../components/ui/dropdown-menu'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { 
  Search, Filter, ChevronDown, RefreshCw, Package, AlertTriangle, LayoutGrid, List, ArrowRight, Activity, Calendar
} from 'lucide-react'
import { ProductDetailModal } from '../components/ProductDetailModal'
import { Card, CardContent, CardFooter } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'

interface Batch {
  _id?: number | string;
  manufacturerBatchNo: string;
  productName: string;
  dosageStrength: string;
  quantity: number;
  unit: string;
  status: string;
  expiryDate: string;
  productImage?: string;
  packingType?: string;
  
  // Extended fields for details
  ingredients?: string;
  storageTemp?: string;
  dosageInstructions?: string;
  packComposition?: string;
  totalUnitsPerPack?: number;
  baseUnitCost?: number;
  baseUnitPrice?: number;
  totalBatchValue?: number;
  ipfsHash?: string;
  manufacturerName?: string;
  transactionHash?: string;
  createdAt?: string;
}

export function ManufacturerInventory() {
  const { address } = useAccount()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt_desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Detail Dialog State
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // Sync Dialog State
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [syncTxHash, setSyncTxHash] = useState('')
  const [syncing, setSyncing] = useState(false)

  const fetchInventory = async () => {
    if (!address) return;
    setLoading(true)
    try {
      const response = await batchApi.search(address, {
        q: searchQuery,
        status: statusFilter,
        sort: sortBy,
        page,
        limit: 20
      });

      if (response && response.batches) {
        setBatches(response.batches)
        setTotalPages(response.pagination.pages)
      }
    } catch (error) {
      console.error('Inventory fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1) // Reset to page 1 on search change
      fetchInventory()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter, sortBy, address])

  // Pagination change
  useEffect(() => {
    fetchInventory()
  }, [page])

  const handleSyncSubmit = async () => {
      if (!syncTxHash) return;
      setSyncing(true);
      try {
          const res = await fetch('http://localhost:3000/api/events/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ txHash: syncTxHash.trim() })
          });
          const data = await res.json();
          if (data.success) {
              alert(`Sync Successful! Processed ${data.details.processedCount} events.`);
              setSyncDialogOpen(false);
              setSyncTxHash('');
              fetchInventory(); 
          } else {
              alert(`Sync Failed: ${data.error}`);
          }
      } catch (err: any) {
          alert(`Sync Error: ${err.message}`);
      } finally {
          setSyncing(false);
      }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      case 'IN_TRANSIT': return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'DELIVERED': return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'RECALLED': return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  }

  // Helper to check if expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 && diffDays <= 30;
  }

  // Helper to check if expired
  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  const handleOpenDetail = (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailDialogOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
       {/* Background Grid Pattern */}
       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
       
       <div className="container mx-auto p-4 md:p-6 max-w-[1600px] relative z-10">
           {/* HEADER */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                 Inventory Manager <Badge variant="outline" className="ml-2 border-teal-500/30 text-teal-400 bg-teal-500/10">{batches.length} Items</Badge>
              </h1>
              <p className="text-slate-400 mt-1">Real-time stock tracking and lineage vault.</p>
            </div>
            <div className="flex items-center gap-3">
               <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSyncDialogOpen(true)}
                  className="bg-slate-900 border-teal-500/20 text-teal-400 hover:bg-teal-500/10 transition-all font-mono text-xs"
               >
                 <RefreshCw className="w-3.5 h-3.5 mr-2" />
                 Sync_Missing
               </Button>
               
               <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchInventory} 
                  disabled={loading}
                  className="bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-teal-500/50 transition-all font-mono text-xs"
               >
                 <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                 Refresh_Data
               </Button>
            </div>
          </div>
    
          {/* CONTROL BAR */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-8 sticky top-4 z-20 shadow-2xl flex flex-col lg:flex-row gap-4 justify-between items-center">
             
             {/* Search */}
             <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                <Input 
                  placeholder="Search by Product Name or Batch ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-950 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20 h-10 transition-all"
                />
             </div>
    
             {/* Filters & View Toggle */}
             <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="bg-slate-950 border-white/10 text-slate-300 hover:text-white hover:border-teal-500/30 w-[140px] justify-between h-10">
                        {statusFilter === 'ALL' ? 'All Status' : statusFilter}
                        <Filter className="w-3.5 h-3.5 ml-2 opacity-50" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-white/10 text-slate-300">
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setStatusFilter('ALL')}>All Status</DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setStatusFilter('CREATED')}>Minted (Created)</DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setStatusFilter('IN_TRANSIT')}>In Transit</DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setStatusFilter('RECALLED')}>Recalled</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
    
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="bg-slate-950 border-white/10 text-slate-300 hover:text-white hover:border-teal-500/30 w-[160px] justify-between h-10">
                        Sort Order
                        <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-white/10 text-slate-300">
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setSortBy('createdAt_desc')}>Newest First</DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setSortBy('expiry_asc')}>Expiry: Soonest</DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setSortBy('expiry_desc')}>Expiry: Latest</DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setSortBy('qty_asc')}>Qty: Low to High</DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-white/5 hover:text-white cursor-pointer" onClick={() => setSortBy('qty_desc')}>Qty: High to Low</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-8 w-px bg-white/10 mx-2" />

                <div className="flex bg-slate-950 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                         onClick={() => setViewMode('list')}
                         className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
             </div>
          </div>
    
          {/* CONTENT AREA */}
          {viewMode === 'grid' ? (
              /* VIEW A: VAULT GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
                {batches.map((batch) => (
                    <Card 
                        key={batch.manufacturerBatchNo || batch._id} 
                        className="bg-slate-900/40 border border-white/10 hover:border-teal-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(20,184,166,0.1)] group overflow-hidden"
                    >
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 z-10">
                            <Badge className={`${getStatusColor(batch.status)} border backdrop-blur-md shadow-lg`}>
                                {batch.status}
                            </Badge>
                        </div>

                        {/* Image Area */}
                        <div className="h-40 bg-slate-950/50 relative border-b border-white/5">
                            {batch.productImage ? (
                                <img src={batch.productImage} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt={batch.productName} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                    <Package className="w-12 h-12 opacity-20" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                            <div className="absolute bottom-3 left-3">
                                <h3 className="text-white font-bold text-lg truncate shadow-black drop-shadow-md">{batch.productName}</h3>
                                <p className="text-slate-400 text-xs font-mono">{batch.manufacturerBatchNo}</p>
                            </div>
                        </div>

                        <CardContent className="pt-4 space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Stock Level</p>
                                    <div className="text-2xl font-bold text-teal-400 font-mono">
                                        {batch.quantity.toLocaleString()} <span className="text-sm text-slate-500 font-sans font-normal opacity-70">{batch.unit}</span>
                                    </div>
                                </div>
                                <Activity className="w-5 h-5 text-teal-500/20" />
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-white/5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>Expires: {batch.expiryDate}</span>
                                {isExpiringSoon(batch.expiryDate) && (
                                    <span className="ml-auto text-amber-400 font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Soon
                                    </span>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="pt-0">
                            <Button 
                                className="w-full bg-slate-950 border border-white/10 hover:bg-teal-500/10 hover:border-teal-500/50 hover:text-teal-400 transition-all group/btn" 
                                onClick={() => handleOpenDetail(batch)}
                            >
                                View Metadata
                                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
              </div>
          ) : (
              /* VIEW B: DATA MATRIX LIST */
              <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Table>
                  <TableHeader className="bg-slate-950 border-b border-white/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[80px] text-teal-500/70 text-xs uppercase tracking-wider">Asset</TableHead>
                      <TableHead className="text-teal-500/70 text-xs uppercase tracking-wider">Batch ID</TableHead>
                      <TableHead className="text-teal-500/70 text-xs uppercase tracking-wider">Product</TableHead>
                      <TableHead className="text-teal-500/70 text-xs uppercase tracking-wider">Quantity</TableHead>
                      <TableHead className="text-teal-500/70 text-xs uppercase tracking-wider">Expiry</TableHead>
                      <TableHead className="text-teal-500/70 text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-right text-teal-500/70 text-xs uppercase tracking-wider">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && batches.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                             <div className="flex items-center justify-center gap-2">
                                 <RefreshCw className="w-5 h-5 animate-spin" /> Retrieving blockchain data...
                             </div>
                         </TableCell>
                       </TableRow>
                    ) : batches.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={7} className="h-64 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center">
                               <Package className="w-12 h-12 mb-3 text-slate-700" />
                               <p>Vault is empty or no batches found.</p>
                            </div>
                         </TableCell>
                       </TableRow>
                    ) : (
                       batches.map((batch) => (
                         <TableRow key={batch.manufacturerBatchNo || batch._id} className="group hover:bg-white/5 border-b border-white/5 transition-colors">
                           <TableCell>
                              <div className="w-10 h-10 rounded-md bg-slate-800 overflow-hidden border border-white/10 group-hover:border-teal-500/30 transition-colors">
                                 {batch.productImage ? (
                                   <img src={batch.productImage} alt="" className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-slate-600">
                                      <Package className="w-5 h-5" />
                                   </div>
                                 )}
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="font-mono text-xs text-slate-500 group-hover:text-teal-400 transition-colors">
                                {batch.manufacturerBatchNo || `#${batch._id}`}
                              </div>
                           </TableCell>
                           <TableCell>
                              <div 
                                className="cursor-pointer group/name"
                                onClick={() => handleOpenDetail(batch)}
                              >
                                <div className="font-medium text-slate-200 group-hover/name:text-white transition-colors">
                                   {batch.productName}
                                </div>
                                <div className="text-xs text-slate-500">{batch.dosageStrength}</div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="font-mono text-slate-300">
                                 {batch.quantity.toLocaleString()} <span className="text-xs text-slate-600">{batch.unit}</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                 <span className="text-sm text-slate-400">{batch.expiryDate}</span>
                                 {isExpired(batch.expiryDate) ? (
                                    <Badge variant="destructive" className="text-[10px] px-1 h-5 bg-red-900/50 text-red-400 border-red-500/30">EXP</Badge>
                                 ) : isExpiringSoon(batch.expiryDate) ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                 ) : null}
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className={`${getStatusColor(batch.status)}`}>
                                 {batch.status}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenDetail(batch)}
                                className="text-slate-400 hover:text-teal-400 hover:bg-teal-500/10"
                              >
                                Details
                              </Button>
                           </TableCell>
                         </TableRow>
                       ))
                    )}
                  </TableBody>
                </Table>
              </div>
          )}
           
           {/* Pagination Controls */}
           <div className="flex items-center justify-end p-4 pt-6">
              <div className="flex items-center gap-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                   className="bg-slate-900 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50"
                 >
                   Previous
                 </Button>
                 <div className="text-sm text-slate-500 font-mono">
                    Page <span className="text-white">{page}</span> of {totalPages}
                 </div>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   disabled={page === totalPages}
                   className="bg-slate-900 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50"
                 >
                   Next
                 </Button>
              </div>
           </div>
       </div>
 
       <ProductDetailModal 
         batch={selectedBatch} 
         open={detailDialogOpen} 
         onOpenChange={setDetailDialogOpen} 
       />

       {/* Sync Dialog */}
       <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
           <DialogContent className="bg-slate-900 border-white/10 text-white">
               <DialogHeader>
                   <DialogTitle>Force Sync Transaction</DialogTitle>
                   <DialogDescription>
                       Paste a transaction hash to manually re-process its events. Use this only if a batch is missing after 5+ minutes.
                   </DialogDescription>
               </DialogHeader>
               <div className="py-4">
                   <Input 
                       placeholder="0x..." 
                       value={syncTxHash}
                       onChange={(e) => setSyncTxHash(e.target.value)}
                       className="bg-slate-950 border-white/10 font-mono text-xs"
                   />
               </div>
               <DialogFooter>
                   <Button variant="ghost" onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
                   <Button onClick={handleSyncSubmit} disabled={syncing}>
                       {syncing ? 'Syncing...' : 'Sync Transaction'}
                   </Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>
    </div>
  )
}
