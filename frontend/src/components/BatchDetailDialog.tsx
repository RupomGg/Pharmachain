import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Package, Calendar, Thermometer, FlaskConical, ExternalLink, Box, Activity, DollarSign, FileText } from 'lucide-react'

interface BatchDetailProps {
  batch: any; // We'll use specific type in the parent or shared type
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchDetailDialog({ batch, open, onOpenChange }: BatchDetailProps) {
  if (!batch) return null;

  const isExpired = new Date(batch.expiryDate) < new Date();
  
  // Calculate total items
  const totalItems = (batch.quantity || 0) * (batch.totalUnitsPerPack || 1);
  
  // Calculate estimated total value
  const totalValue = batch.totalBatchValue || 
    (totalItems * (batch.baseUnitPrice || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="font-mono text-xs">
               {batch.manufacturerBatchNo || `ID: ${batch._id}`}
            </Badge>
            <Badge className={
              batch.status === 'CREATED' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
              batch.status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
              batch.status === 'DELIVERED' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
              'bg-slate-100 text-slate-700'
            }>
              {batch.status}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {batch.productName}
          </DialogTitle>
          <DialogDescription className="text-lg text-slate-600">
            {batch.dosageStrength} • {batch.packingType}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          {/* LEFT COLUMN: Visuals & Key Metrics */}
          <div className="space-y-6">
            <div className="aspect-video w-full rounded-xl bg-slate-50 border border-slate-100 overflow-hidden relative group">
              {batch.productImage ? (
                <img 
                  src={batch.productImage} 
                  alt={batch.productName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <Package className="w-16 h-16 mb-2" />
                  <span className="text-sm">No Image Available</span>
                </div>
              )}
            </div>

            {/* Financials Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Value & Pricing
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Base Unit Price</span>
                  <span className="font-mono font-medium text-slate-900">
                    ${batch.baseUnitPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Total Est. Value</span>
                  <span className="font-mono font-bold text-emerald-700 text-lg">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-600" />
                Stock Configuration
              </h3>
               <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Quantity (Packs)</span>
                    <span className="font-medium text-slate-900">{batch.quantity?.toLocaleString()} packs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Total Units/Pack</span>
                    <span className="font-medium text-slate-900">{batch.totalUnitsPerPack || 1} units</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 mt-1">
                    <span className="text-slate-500 block text-xs">Total Single Units</span>
                    <span className="font-medium text-indigo-700">{totalItems.toLocaleString()} items</span>
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Metadata & Details */}
          <div className="space-y-6">
            
            {/* Ingredients */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-indigo-500" />
                Composition & Ingredients
              </h3>
              <div className="text-sm text-slate-600 bg-white border border-slate-200 p-3 rounded-lg">
                {batch.ingredients?.split(';').map((ing: string, i: number) => (
                  <Badge key={i} variant="secondary" className="mr-1 mb-1 font-normal bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">
                    {ing.trim()}
                  </Badge>
                ))}
                {!batch.ingredients && <span className="text-slate-400 italic">No ingredients listed</span>}
              </div>
            </div>

            {/* Storage & Handling */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-500" />
                Storage & Handling
              </h3>
              <p className="text-sm text-slate-600 border-l-2 border-amber-200 pl-3">
                {batch.storageTemp ? `Store at ${batch.storageTemp}` : 'Standard storage conditions apply.'}
              </p>
            </div>

            {/* Dates */}
            <div>
               <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Critical Dates
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">Production Date</span>
                    <span className="text-sm font-medium text-slate-900">
                      {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                 </div>
                 <div className={`p-3 rounded-lg border ${isExpired ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-xs text-slate-500 block mb-1">Expiry Date</span>
                    <span className={`text-sm font-medium ${isExpired ? 'text-red-700' : 'text-slate-900'}`}>
                      {batch.expiryDate}
                      {isExpired && <span className="text-xs font-bold ml-2 text-red-500">(EXPIRED)</span>}
                    </span>
                 </div>
              </div>
            </div>
            
            <hr className="border-slate-100 my-4" />

            {/* Blockchain Info */}
            <div>
               <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                Blockchain Data
              </h3>
              <div className="space-y-2">
                {batch.ipfsHash && (
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${batch.ipfsHash}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 hover:bg-teal-100 transition-colors text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      View Metadata on IPFS
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {batch.transactionHash && (
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono text-slate-500 break-all">
                     <span className="block text-[10px] uppercase text-slate-400 mb-1">Transaction Hash</span>
                     {batch.transactionHash}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close Details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
