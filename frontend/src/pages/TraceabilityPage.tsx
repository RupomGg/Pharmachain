import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Factory, Truck, Store, Package, 
  Globe, FileText, Thermometer, 
  Calendar, Box, Activity, ChevronRight, ShieldCheck, MapPin, Clock
} from 'lucide-react'
import axios from 'axios'
import { Badge } from '../components/ui/badge'
import { CyberSearchInput } from '../components/CyberSearchInput'

// --- Types & Interfaces ---

interface BatchResult {
  batchId: string;
  batchNumber: string;
  productName: string;
  manufacturer: any; // Can be string or User object
  owner: any;        // Can be string or User object
  status: string;
  expiryDate?: string;
  quantity?: number;
  unit?: string;
  
  // Extended fields
  txHash?: string;
  blockNumber?: number;
  dosageStrength?: string;
  productImage?: string;
  ingredients?: string;
  storageTemp?: string;
  
  // Metadata for the UI stats
  totalHandovers?: number;
  lastUpdate?: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  role: 'MANUFACTURER' | 'DISTRIBUTOR' | 'PHARMACY' | 'LOGISTICS';
  location: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
  description?: string;
  txHash?: string;
  icon: any;
}

// --- Helpers for Safe Data Rendering ---

const getSafeName = (entity: any): string => {
  if (!entity) return 'Unknown Entity';
  if (typeof entity === 'string') return entity;
  return entity.name || 'Unknown Entity';
};

const getSafeAddress = (entity: any): string => {
  if (!entity) return 'Unknown Location';
  if (typeof entity === 'string') return entity; // Likely a wallet address if string
  return entity.physicalAddress || entity.walletAddress || 'Location Not Public';
};

const getSafeEmail = (entity: any): string | null => {
  if (entity && typeof entity === 'object' && entity.email) return entity.email;
  return null;
};

// --- Components ---

const TrustChip = ({ hash }: { hash?: string }) => {
  if (!hash) return null;
  const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  
  return (
    <div className="group relative inline-flex items-center gap-2 mt-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-950/30 border border-teal-500/20 rounded-full cursor-pointer hover:bg-teal-900/40 transition-colors">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
        <span className="font-mono text-[10px] text-teal-300 font-medium tracking-wide">
          PROOF: {shortHash}
        </span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap">
           View on Etherscan
        </div>
      </div>
    </div>
  );
};

export function TraceabilityPage() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<BatchResult[]>([])
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null) // Contains { batch, upstream, downstream }

  
  // View mode is derived from selection now for simplicity


  // --- Logic ---

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)

    setResults([])
    setSelectedBatch(null)
    
    // Simulate delay for the "Cyber" feel if needed, but direct call is better
    try {
      const res = await axios.get(`http://localhost:3000/api/trace/search?q=${query}`)
      
      if (res.data.batch && res.data.upstream) {
        // Precise match with full trace
        processFullTrace(res.data)
      } else if (res.data.candidates) {
        // Multiple matches
        setResults(res.data.candidates)
      } else {
        setResults([])
      }
    } catch (err: any) {
      console.error(err)
      // setError("No records found on the blockchain.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectBatch = async (batchId: string) => {
    setIsLoading(true)
    try {
        const res = await axios.get(`http://localhost:3000/api/trace/${batchId}`)
        processFullTrace(res.data)
    } catch (err) {
        console.error(err)
        // setError("Failed to verify batch lineage.")
    } finally {
        setIsLoading(false)
    }
  }

  const processFullTrace = (data: any) => {
      // Add computed stats
      const totalHandovers = (data.upstream?.batches?.length || 0) + (data.downstream?.batches?.length || 0);
      data.batch.totalHandovers = totalHandovers;
      data.batch.lastUpdate = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); // Mock 'Live' time for demo
      
      setSelectedBatch(data)
  }

  // Build the Node Graph / Timeline
  const buildJourneyMap = (traceData: any): TimelineEvent[] => {
      if (!traceData || !traceData.batch) return []
      
      const events: TimelineEvent[] = []
      const current = traceData.batch
      const upstream = traceData.upstream?.batches || []
      const downstream = traceData.downstream?.batches || []

      // 1. Ancestors
      upstream.forEach((anc: any) => {
          events.push({
              id: `up-${anc.batchId}`,
              title: anc.status === 'CREATED' ? 'Minted on Blockchain' : 'Upstream Transfer',
              role: 'MANUFACTURER',
              location: getSafeAddress(anc.manufacturer), // Approximate location from user data
              timestamp: new Date(anc.createdAt).toLocaleDateString() + ' • ' + new Date(anc.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              status: 'completed',
              description: `Batch #${anc.batchNumber} origin verified.`,
              txHash: anc.txHash,
              icon: Factory
          })
      })

      // 2. Current Batch Creation / Receipt
      events.push({
          id: 'curr-create',
          title: current.parentBatchId ? 'Received Sequence' : 'Production Initialized',
          role: current.parentBatchId ? 'DISTRIBUTOR' : 'MANUFACTURER',
          location: getSafeAddress(current.parentBatchId ? current.owner : current.manufacturer),
          timestamp: new Date(current.createdAt).toLocaleDateString() + ' • ' + new Date(current.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: 'completed',
          description: current.parentBatchId 
              ? `Assets transferred from Batch #${current.parentBatchId}` 
              : `Product ID generated by ${getSafeName(current.manufacturer)}`,
          txHash: current.txHash,
          icon: current.parentBatchId ? Truck : Factory
      })

      // 3. Current Status Logic
      if (current.status === 'IN_TRANSIT') {
           events.push({
              id: 'curr-transit',
              title: 'Logistics Handover',
              role: 'LOGISTICS',
              location: 'In Transit',
              timestamp: 'Live Tracking...',
              status: 'current',
              description: 'Goods are currently moving through the supply network.',
              icon: Truck
           })
      } else if (current.status === 'SOLD' || current.status === 'DELIVERED') {
          events.push({
              id: 'curr-sold',
              title: current.status === 'SOLD' ? 'Dispensed to Patient' : 'Pharmacy Verified',
              role: 'PHARMACY',
              location: getSafeAddress(current.owner),
              timestamp: 'Visual Confirmation',
              status: 'completed',
              description: 'Final verification complete at point of care.',
              icon: Store
          })
      }

      // 4. Descendants
      downstream.forEach((desc: any) => {
          events.push({
              id: `down-${desc.batchId}`,
              title: 'Downstream Distribution',
              role: 'DISTRIBUTOR',
              location: getSafeAddress(desc.owner), // New owner location
              timestamp: new Date(desc.createdAt).toLocaleDateString(),
              status: 'pending', // Logic could be improved to differentiate completed transfers
              description: `Transferred to ${getSafeName(desc.owner)}`,
              txHash: desc.txHash,
              icon: Globe
          })
      })

      return events;
  }

  const journeyEvents = selectedBatch ? buildJourneyMap(selectedBatch) : [];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-teal-500/30">
      
      {/* 1. Full Width Search & Stats Hero */}
      <section className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
            
            {/* Cyber Search Input */}
            <div className="w-full max-w-3xl">
                <CyberSearchInput 
                    value={query}
                    onChange={setQuery}
                    onSubmit={handleSearch}
                    isLoading={isLoading}
                />
            </div>

            {/* Live Stats (Only if batch selected) */}
            <AnimatePresence>
                {selectedBatch && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="hidden xl:flex items-center gap-12"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Current Status</span>
                            <div className="flex items-center gap-2">
                                <span className={`relative flex h-2.5 w-2.5`}>
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                                </span>
                                <span className="text-teal-400 font-bold text-sm tracking-wide">{selectedBatch.batch.status}</span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Verified Handovers</span>
                            <span className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                                <Activity className="w-4 h-4 text-cyan-400" />
                                {selectedBatch.batch.totalHandovers} Stops
                            </span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Last Update</span>
                            <span className="text-slate-300 font-medium text-sm tracking-wide">{selectedBatch.batch.lastUpdate}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 2. Main Layout Output */}
      <main className="max-w-[1920px] mx-auto p-6 lg:p-10">
        
        {/* Error / Empty State */}
        {!selectedBatch && (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-teal-500/20 blur-[60px] rounded-full" />
                    <Globe className="w-24 h-24 text-slate-700 relative z-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-500">Awaiting Trace Request</h2>
                <p className="text-slate-600 max-w-md">Enter a Batch ID above to initialize the blockchain ledger and visualize the asset journey in real-time.</p>
                
                {/* Search Results List (Candidates) */}
                {results.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-2xl mt-10 space-y-3"
                    >
                         <h3 className="text-left text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Possible Matches</h3>
                         {results.map(b => (
                            <div key={b.batchId} onClick={() => handleSelectBatch(b.batchId)} className="group flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-white/5 hover:border-teal-500/30 cursor-pointer transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-teal-500">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-slate-200 font-medium group-hover:text-teal-300 transition-colors">{b.productName}</div>
                                        <div className="text-xs text-slate-500 font-mono">{b.batchNumber}</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-teal-500" />
                            </div>
                         ))}
                    </motion.div>
                )}
             </div>
        )}

        {/* 3. The Dashboard View */}
        {selectedBatch && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* --- Left Column: ASSET DNA (Sticky) --- */}
                <div className="xl:col-span-4 xl:sticky xl:top-32 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Product Image */}
                        <div className="aspect-video bg-slate-950 relative overflow-hidden group">
                             {selectedBatch.batch.productImage ? (
                                <img src={selectedBatch.batch.productImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt={selectedBatch.batch.productName} />
                             ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 gap-4">
                                    <Package className="w-16 h-16" />
                                    <span className="text-sm font-mono">NO VISUAL DATA</span>
                                </div>
                             )}
                             
                             {/* Floating Verification Shield */}
                             <div className="absolute top-4 right-4 bg-teal-500 text-slate-950 px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.6)] animate-pulse">
                                 <ShieldCheck className="w-4 h-4 fill-slate-950" />
                                 BLOCKCHAIN VERIFIED
                             </div>
                        </div>

                        <div className="p-8">
                            {/* Identity Block */}
                            <div className="mb-8">
                                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight leading-tight">{selectedBatch.batch.productName}</h1>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="border-teal-500/30 text-teal-400 font-mono text-xs px-3 py-1">
                                        ID: {selectedBatch.batch.batchNumber}
                                    </Badge>
                                    <span className="text-xs text-slate-500 font-mono">{selectedBatch.batch.quantity} {selectedBatch.batch.unit}</span>
                                </div>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-2">
                                        <Thermometer className="w-3 h-3 group-hover:text-cyan-400" /> Storage
                                    </div>
                                    <div className="text-slate-200 font-medium">{selectedBatch.batch.storageTemp || 'Ambient'}</div>
                                </div>
                                <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-2">
                                        <Box className="w-3 h-3 group-hover:text-cyan-400" /> Dosage
                                    </div>
                                    <div className="text-slate-200 font-medium">{selectedBatch.batch.dosageStrength || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group col-span-2">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-2">
                                        <Calendar className="w-3 h-3 group-hover:text-cyan-400" /> Expiry Date
                                    </div>
                                    <div className="text-slate-200 font-medium text-lg">{new Date(selectedBatch.batch.expiryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                </div>
                            </div>

                             {/* Ingredients */}
                            {selectedBatch.batch.ingredients && (
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold mb-3 block">Active Elements</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedBatch.batch.ingredients.split(';').map((ing: string, i: number) => (
                                            <span key={i} className="text-xs text-cyan-300 bg-cyan-950/30 border border-cyan-500/20 px-2.5 py-1 rounded-md">
                                                {ing.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Manufacturer Contact Logic */}
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                                        M
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white mb-0.5">{getSafeName(selectedBatch.batch.manufacturer)}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                                            <MapPin className="w-3 h-3 text-slate-500" />
                                            {getSafeAddress(selectedBatch.batch.manufacturer)}
                                        </div>
                                        {getSafeEmail(selectedBatch.batch.manufacturer) && (
                                            <div className="text-xs text-indigo-400 flex items-center gap-1.5">
                                                <FileText className="w-3 h-3" />
                                                {getSafeEmail(selectedBatch.batch.manufacturer)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>

                {/* --- Right Column: IMMERSIVE JOURNEY MAP --- */}
                <div className="xl:col-span-8">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="relative pl-8 xl:pl-0"
                    >
                         {/* Header */}
                         <div className="flex items-end justify-between mb-12 border-b border-white/5 pb-4">
                             <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Detailed Journey Map</h3>
                                <p className="text-slate-400 text-sm">Validating {journeyEvents.length} distinct blockchain checkpoints.</p>
                             </div>
                             <div className="hidden sm:flex flex-col items-end">
                                 <span className="text-xs text-slate-500 font-mono mb-1">NETWORK</span>
                                 <span className="text-sm text-teal-400 font-mono flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                     Mainnet Alpha
                                 </span>
                             </div>
                         </div>

                         {/* Timeline Container */}
                         <div className="relative space-y-16">
                            
                            {/* Vertical Line */}
                            <div className="absolute left-[27px] xl:left-[39px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-teal-500 via-cyan-500 to-slate-800" />

                            {journeyEvents.map((event, index) => (
                                <motion.div 
                                    key={event.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="relative flex items-start gap-8"
                                >
                                    {/* The Node */}
                                    <div className="relative z-10 flex-shrink-0">
                                        <div className={`w-14 h-14 xl:w-20 xl:h-20 rounded-2xl flex items-center justify-center border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all ${
                                            event.status === 'completed' ? 'bg-slate-900 border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.2)]' : 
                                            event.status === 'current' ? 'bg-teal-900/20 border-teal-400 animate-pulse' : 
                                            'bg-slate-950 border-slate-700'
                                        }`}>
                                            <event.icon className={`w-6 h-6 xl:w-8 xl:h-8 ${
                                                event.status === 'completed' ? 'text-teal-400' : 
                                                event.status === 'current' ? 'text-white' : 'text-slate-600'
                                            }`} />
                                        </div>
                                        {event.status === 'current' && (
                                            <div className="absolute -inset-2 border border-teal-500/30 rounded-3xl animate-ping" />
                                        )}
                                    </div>

                                    {/* The Card */}
                                    <div className="flex-1 bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-6 xl:p-8 hover:bg-slate-800/40 transition-colors group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div>
                                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest mb-2 ${
                                                    event.role === 'MANUFACTURER' ? 'bg-indigo-500/10 text-indigo-400' :
                                                    event.role === 'DISTRIBUTOR' ? 'bg-cyan-500/10 text-cyan-400' :
                                                    'bg-green-500/10 text-green-400'
                                                }`}>
                                                    {event.role}
                                                </span>
                                                <h4 className="text-xl font-bold text-white">{event.title}</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 text-slate-400 text-sm justify-end">
                                                    <Clock className="w-4 h-4" />
                                                    {event.timestamp}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500 text-xs justify-end mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {event.location}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-slate-300 text-sm leading-relaxed mb-6 border-l-2 border-white/10 pl-4">
                                            {event.description}
                                        </p>

                                        {/* Trust Block (Tx Hash) */}
                                        {event.txHash && (
                                            <div className="bg-slate-950 rounded-xl p-4 flex items-center justify-between border border-white/5 group-hover:border-teal-500/20 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Immutable Ledger Record</span>
                                                    <TrustChip hash={event.txHash} />
                                                </div>
                                                <a 
                                                   href={`https://sepolia.etherscan.io/tx/${event.txHash}`} 
                                                   target="_blank" 
                                                   rel="noreferrer"
                                                   className="p-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-slate-900 transition-all"
                                                >
                                                    <Activity className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                         </div>

                         {/* End of Line Indicator */}
                         <div className="relative mt-8 ml-[27px] xl:ml-[39px] pl-16">
                            <div className="w-3 h-3 bg-slate-800 rounded-full ring-4 ring-slate-900" />
                         </div>

                    </motion.div>
                </div>
            </div>
        )}
      </main>
    </div>
  )
}
