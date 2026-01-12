import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, QrCode, Copy, Thermometer, Calendar, Activity, 
  ExternalLink, DollarSign, ShieldCheck, AlertTriangle, 
  Truck, Box, Layers
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface ProductDetailModalProps {
  batch: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailModal({ batch, open, onOpenChange }: ProductDetailModalProps) {
  if (!batch) return null;

  const isExpired = new Date(batch.expiryDate) < new Date();
  
  // Calculate expiry status
  const today = new Date();
  const expiry = new Date(batch.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const isExpiringSoon = diffDays > 0 && diffDays <= 180; // 6 months

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => onOpenChange(false)}
               className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="relative w-full h-full max-w-7xl mx-auto flex flex-col bg-transparent overflow-hidden sm:rounded-t-3xl sm:h-[95vh] sm:mt-auto"
               onClick={(e) => e.stopPropagation()}
            >
                {/* Header Bar */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                        <div>
                            <h2 className="text-sm font-mono text-slate-400 uppercase tracking-widest">Product Inspector</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold">BATCH #{batch.manufacturerBatchNo || batch._id}</span>
                                {isExpired && <Badge variant="destructive" className="h-5 text-[10px]">EXPIRED</Badge>}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="p-3 rounded-full border border-white/10 text-slate-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all group"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
                        
                        {/* LEFT COLUMN: Visuals & Identity (Col-Span-5) */}
                        <div className="md:col-span-12 lg:col-span-5 space-y-6">
                            
                            {/* Hero Card */}
                            <div className="relative aspect-square md:aspect-auto md:h-[500px] rounded-2xl bg-slate-900/50 border border-white/10 overflow-hidden group">
                                {/* Scanning Effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/10 to-transparent w-full h-20 animate-scan z-10 pointer-events-none" style={{ animationDuration: '3s' }} />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.8)] animate-scan-line z-10" />

                                {batch.productImage ? (
                                    <img src={batch.productImage} className="w-full h-full object-cover opacity-80" alt={batch.productName} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                       <Box className="w-32 h-32 text-slate-700 stroke-1" />
                                    </div>
                                )}
                                
                                {/* Overlay Details */}
                                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
                                    <h1 className="text-4xl font-bold text-white mb-2">{batch.productName}</h1>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-slate-800 text-teal-400 border-teal-500/30 text-lg py-1 px-3">
                                            {batch.dosageStrength}
                                        </Badge>
                                        <span className="text-slate-400 text-lg">{batch.packingType}</span>
                                    </div>
                                </div>
                            </div>

                            {/* QR & Hash Block */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1 bg-white p-4 rounded-xl flex items-center justify-center">
                                    <QrCode className="w-full h-full text-slate-900" />
                                </div>
                                <div className="col-span-2 bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col justify-center gap-2">
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-mono">Digital Signature</span>
                                    <div className="flex items-center gap-2 bg-slate-950 rounded p-2 border border-white/5">
                                        <code className="text-xs text-teal-400 font-mono truncate flex-1">
                                            {batch.transactionHash || '0x7f...3a2b'}
                                        </code>
                                        <button className="text-slate-500 hover:text-white transition-colors">
                                           <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                                        <ShieldCheck className="w-3 h-3" /> Encrypted & Verified
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Data Matrix (Col-Span-7) */}
                        <div className="md:col-span-12 lg:col-span-7 space-y-6">
                            
                            {/* Module A: Composition */}
                            <div className="bg-slate-900/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                   <Layers className="w-5 h-5 text-teal-400" /> Composition Matrix
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {batch.ingredients ? (
                                        batch.ingredients.split(';').map((ing: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-teal-500/20 text-teal-300 text-sm font-medium">
                                                {ing.trim()}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-500 italic">No composition data available.</span>
                                    )}
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-8">
                                    <div>
                                        <span className="text-slate-500 text-xs uppercase mb-1 block">Pack Composition</span>
                                        <span className="text-white font-mono">{batch.packComposition || batch.unit}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 text-xs uppercase mb-1 block">Total Units</span>
                                        <span className="text-white font-mono">{batch.totalUnitsPerPack} units/pack</span>
                                    </div>
                                </div>
                            </div>

                            {/* Module B: Environmental & Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Environment */}
                                <div className="bg-slate-900/40 border border-white/10 rounded-xl p-6">
                                     <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                        <Thermometer className="w-4 h-4 text-amber-500" /> Storage Conditions
                                     </h3>
                                     <div className="text-2xl font-bold text-white">
                                        {batch.storageTemp || '25°C'}
                                     </div>
                                     <p className="text-xs text-slate-500 mt-1">Controlled Room Temperature</p>
                                </div>

                                {/* Dates */}
                                <div className="bg-slate-900/40 border border-white/10 rounded-xl p-6">
                                     <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" /> Timeline
                                     </h3>
                                     <div className="space-y-3">
                                         <div className="flex justify-between items-center text-sm">
                                             <span className="text-slate-500">Manufactured</span>
                                             <span className="text-white font-mono">{batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : 'N/A'}</span>
                                         </div>
                                         <div className="flex justify-between items-center text-sm">
                                             <span className="text-slate-500">Expiry</span>
                                             <span className={`font-mono ${isExpired ? 'text-red-500 font-bold' : isExpiringSoon ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {batch.expiryDate}
                                             </span>
                                         </div>
                                     </div>
                                </div>
                            </div>

                            {/* Module C: Financials (Private) */}
                            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-6 overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px]" />
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" /> Financial Data (Confidential)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <span className="text-[10px] text-slate-600 block uppercase">Base Cost</span>
                                            <span className="text-white font-mono">${((batch.financials?.baseUnitCost || 0) * (batch.totalUnitsPerPack || 1)).toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-600 block uppercase">Market Price</span>
                                            <span className="text-white font-mono">${((batch.financials?.baseUnitPrice || 0) * (batch.totalUnitsPerPack || 1)).toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-600 block uppercase">Est. Revenue</span>
                                            <span className="text-emerald-400 font-mono">${(batch.quantity * ((batch.financials?.baseUnitPrice || 0) * (batch.totalUnitsPerPack || 1))).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>Profit Margin</span>
                                            <span>85%</span>
                                        </div>
                                        <Progress value={85} className="h-1 bg-slate-900" />
                                    </div>
                                </div>
                            </div>

                            {/* Module D: Blockchain */}
                            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <Activity className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-400 font-bold text-sm">Metadata Verified on IPFS</h4>
                                        <p className="text-emerald-500/60 text-xs">Immutable Record #8829</p>
                                    </div>
                                </div>
                                {batch.ipfsHash && (
                                    <a 
                                        href={`https://gateway.pinata.cloud/ipfs/${batch.ipfsHash}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 font-mono group"
                                    >
                                        VIEW RAW DATA <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                    </a>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex justify-between items-center z-20">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Status: {batch.status}</span>
                    </div>
                    <div className="flex gap-4">
                         <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Report Issue
                         </Button>
                         <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/20">
                            Transfer Batch <Truck className="w-4 h-4 ml-2" />
                         </Button>
                    </div>
                </div>

            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
