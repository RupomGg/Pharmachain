import { useState, useRef, useEffect } from 'react';
import { useBulkBatchImport } from '../hooks/useBulkBatchImport';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { useAccount } from 'wagmi';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, Download, Terminal, Database, Play } from 'lucide-react';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

interface BulkBatchImportProps {
  initialData?: any[]; 
  onSuccess?: () => void;
}

export function BulkBatchImport({ initialData = [], onSuccess }: BulkBatchImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<'select' | 'uploaded' | 'minting' | 'complete'>('select');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { address } = useAccount();

  const {
    uploadCSV,
    uploadManualBatches,
    mintBatches,
    uploadAndMint,
    reset,
    isUploading,
    uploadError,
    uploadedBatches,
    contractData,
    isPending,
    isConfirming,
    isConfirmed,
    contractError,
    isProcessing,
  } = useBulkBatchImport(CONTRACT_ADDRESS);

  const [processedBatchIds, setProcessedBatchIds] = useState<Set<string>>(new Set());

  // Effect to process manual entries automatically
  useEffect(() => {
    const processManualData = async () => {
      if (initialData && initialData.length > 0 && address) {
         const newBatches = initialData.filter(batch => !processedBatchIds.has(batch.batchNumber));
         if (newBatches.length === 0) return;
         
         try {
           await uploadManualBatches(newBatches, address);
           setProcessedBatchIds(prev => {
             const updated = new Set(prev);
             newBatches.forEach(batch => updated.add(batch.batchNumber));
             return updated;
           });
           setStep('uploaded'); 
         } catch (e) {
           console.error("Manual upload failed", e);
         }
      }
    };
    processManualData();
  }, [initialData, address]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStep('select');
      reset();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setStep('select');
      reset();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadCSV(selectedFile);
      setStep('uploaded');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleMint = async () => {
    try {
      setStep('minting');
      await mintBatches();
    } catch (error) {
      setStep('uploaded');
    }
  };

  const handleUploadAndMint = async () => {
    if (!selectedFile) return;
    try {
      setStep('minting');
      await uploadAndMint(selectedFile);
      setStep('complete');
    } catch (error) {
      setStep('select');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStep('select');
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isConfirmed && step === 'minting') {
    setStep('complete');
  }

  const uploadStatus = uploadedBatches.reduce((acc, batch) => {
    let status = 'success';
    if (isPending || isConfirming) status = 'uploading';
    if (isConfirmed) status = 'minted';
    acc[batch.batchNumber] = status;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0" />
        
        <CardHeader className="pb-4 border-b border-white/5">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
               <UploadCloud className="w-6 h-6 text-teal-400" />
            </div>
            Bulk Batch Import
          </CardTitle>
          <CardDescription className="text-slate-400">
            Securely upload batch schedules. Supports encrypted CSV parsing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          
          {/* Step 1: Dropzone Area - Only show if not waiting on manual data/uploading */}
          {(!initialData || initialData.length === 0) && (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 group
                ${isDragging 
                    ? 'border-teal-400 bg-teal-900/20 shadow-[0_0_30px_rgba(20,184,166,0.3)]' 
                    : 'border-slate-700 bg-slate-950/30 hover:border-slate-500 hover:bg-slate-950/50'
                }
              `}
            >
                <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-teal-500/20' : 'bg-slate-800'}`}>
                   <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">Drag & drop production schedule</h3>
                <p className="text-sm text-slate-500 mb-6">Supports .csv files (max 50 batches)</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                  disabled={isProcessing}
                />
                
                <div className="flex flex-col gap-3 w-full max-w-xs">
                     <label
                      htmlFor="csv-upload"
                      className="flex items-center justify-center gap-2 px-6 py-3 border border-teal-500/50 text-teal-400 rounded-lg cursor-pointer hover:bg-teal-500/10 hover:border-teal-400 transition-all font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      {selectedFile ? 'Change File' : 'Select File'}
                    </label>
                    {selectedFile && (
                      <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 py-1.5 rounded border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle2 className="w-3 h-3" />
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </div>
                    )}
                </div>
            </div>
          )}

          {/* Processing States */}
          {isUploading && (
            <div className="bg-slate-950/50 rounded-xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between text-sm">
                 <span className="flex items-center gap-2 text-teal-400 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing & Encrypting Data...
                 </span>
                 <span className="text-slate-500">IPFS Upload</span>
              </div>
              <Progress value={50} className="h-2 bg-slate-900" />
            </div>
          )}

          {/* Errors */}
          {(uploadError || contractError) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 text-red-400">
               <AlertTriangle className="w-5 h-5 shrink-0" />
               <p className="text-sm font-medium">{uploadError || contractError?.message || 'Operation failed'}</p>
            </div>
          )}

          {/* Preview Table */}
          {uploadedBatches.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                     <Database className="w-4 h-4 text-teal-500" />
                     Sequence Preview <Badge variant="outline" className="ml-2 border-teal-500/30 text-teal-400 bg-teal-500/10">{uploadedBatches.length}</Badge>
                  </h3>
               </div>
               
               <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-950/80 shadow-inner">
                 <Table>
                   <TableHeader className="bg-slate-900 border-b border-white/10">
                     <TableRow className="hover:bg-transparent">
                       <TableHead className="text-xs uppercase tracking-wider text-teal-500 font-bold w-[120px]">Batch ID</TableHead>
                       <TableHead className="text-xs uppercase tracking-wider text-teal-500 font-bold">Product</TableHead>
                       <TableHead className="text-xs uppercase tracking-wider text-teal-500 font-bold">Specs</TableHead>
                       <TableHead className="text-xs uppercase tracking-wider text-teal-500 font-bold">Qty</TableHead>
                       <TableHead className="text-xs uppercase tracking-wider text-teal-500 font-bold text-right">Status</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {uploadedBatches.map((batch) => (
                       <TableRow key={batch.batchNumber} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                         <TableCell className="font-mono text-slate-300 font-medium">{batch.batchNumber}</TableCell>
                         <TableCell>
                           <div className="flex items-center gap-3">
                              {batch.metadata?.image ? (
                                <img src={batch.metadata.image} className="w-8 h-8 rounded border border-white/10 object-cover" alt="" onError={(e) => (e.target as HTMLImageElement).src = ''}/>
                              ) : <div className="w-8 h-8 rounded border border-white/10 bg-slate-900" />}
                              <div>
                                <div className="text-white font-medium text-sm">{batch.productName}</div>
                                <div className="text-xs text-slate-500">{batch.dosageStrength}</div>
                              </div>
                           </div>
                         </TableCell>
                         <TableCell className="text-slate-400 text-xs">
                            {batch.packComposition || batch.unit}
                         </TableCell>
                         <TableCell className="text-slate-300 font-mono">
                            {batch.quantity.toLocaleString()}
                         </TableCell>
                         <TableCell className="text-right">
                           {uploadStatus[batch.batchNumber] === 'success' && (
                              <div className="flex items-center justify-end gap-2">
                                 <span className="text-xs text-emerald-500 font-medium">Ready</span>
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                              </div>
                           )}
                           {uploadStatus[batch.batchNumber] === 'minted' && (
                              <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">MINTED</Badge>
                           )}
                           {uploadStatus[batch.batchNumber] === 'uploading' && (
                              <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30">MINTING...</Badge>
                           )}
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex gap-4 pt-4 border-t border-white/5">
             {(step === 'select' && selectedFile) && (
                <>
                  <Button onClick={handleUpload} disabled={isProcessing} variant="secondary" className="flex-1 bg-slate-800 text-white hover:bg-slate-700">
                     <UploadCloud className="w-4 h-4 mr-2" /> Upload Only
                  </Button>
                  <Button onClick={handleUploadAndMint} disabled={isProcessing} className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/20">
                     <Play className="w-4 h-4 mr-2" /> Encrypt & Mint Sequence
                  </Button>
                </>
             )}
             
             {step === 'uploaded' && (
                <div className="w-full">
                     <Button onClick={handleMint} disabled={isProcessing || processedBatchIds.size === 0 && !selectedFile} className="w-full h-12 text-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(13,148,136,0.4)] transition-all hover:scale-[1.01]">
                        {isPending || isConfirming ? <Loader2 className="w-5 h-5 mr-3 animate-spin"/> : <Terminal className="w-5 h-5 mr-3" />}
                        {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting Sequence...' : 'Initialize Minting Sequence'}
                     </Button>
                     {contractData && (
                        <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"/>
                            Est. Gas: ~0.004 ETH
                        </p>
                    )}
                </div>
             )}

             {step === 'complete' && (
                <div className="w-full bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                    <div className="inline-flex p-3 rounded-full bg-green-500/20 mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Sequence Complete</h3>
                    <p className="text-slate-400 mb-6">All batches have been successfully minted to the blockchain.</p>
                    <Button onClick={handleReset} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                        Start New Sequence
                    </Button>
                </div>
             )}
          </div>

        </CardContent>
      </Card>

      {/* CSV Template - Only show if not manual mode */}
      {(!initialData || initialData.length === 0) && (
        <Card className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-teal-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> CSV Structure Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-white/5 mb-4">
                batchNumber, productName, dosageStrength, packingType, quantity, expiryDate
             </div>
             
             <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-white/5"
              onClick={() => {
                const csvContent = `batchNumber,productName,dosageStrength,packingType,quantity,expiryDate...`; // truncated for brevity
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'batch-import-template.csv';
                a.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
