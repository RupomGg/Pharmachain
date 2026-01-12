
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MedicineDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  batch: any // Ideally typed with your Batch type
}

export function MedicineDetailsModal({ isOpen, onClose, batch }: MedicineDetailsModalProps) {
  if (!batch) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-6 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-teal-700 dark:text-teal-400">
              {batch.productName || `Batch #${batch.batchId}`}
            </DialogTitle>
            <Badge 
              variant={batch.status === 'RECALLED' ? 'destructive' : 'default'}
              className="px-4 py-1 text-sm font-semibold uppercase tracking-wider"
            >
              {batch.status}
            </Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manufactured by <span className="font-semibold text-slate-700 dark:text-slate-200">{batch.manufacturerName || 'Unknown Manufacturer'}</span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-slate-500 uppercase">Expiry Date</h4>
              <p className="text-lg font-semibold">{batch.expiryDate || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-slate-500 uppercase">Batch ID</h4>
              <p className="text-lg font-mono">{batch.batchId}</p>
            </div>
          </div>

          {/* Dosage Instructions */}
          {batch.dosageInstructions && (
            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-100 dark:border-teal-800">
              <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-300 mb-2">Dosage & Instructions</h4>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {batch.dosageInstructions}
              </p>
            </div>
          )}

          {/* PDF Viewer */}
          {batch.pdfUrl ? (
            <div className="space-y-2">
               <h4 className="text-sm font-medium text-slate-500 uppercase">Product Documentation</h4>
               <div className="w-full h-96 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                 <iframe 
                   src={batch.pdfUrl} 
                   className="w-full h-full"
                   title="Product Document"
                 />
               </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-slate-50 rounded-lg border border-dashed border-slate-300">
               <span className="text-slate-400 italic">No documentation available for this batch</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button variant="outline" onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none">
            Close Viewer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
