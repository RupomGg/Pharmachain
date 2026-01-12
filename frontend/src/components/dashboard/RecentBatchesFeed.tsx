import { Clock } from 'lucide-react';
import { useOwnerBatches } from '../../hooks/useBatches';
import { useAccount } from 'wagmi';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export function RecentBatchesFeed() {
  const { address } = useAccount();
  const { data, isLoading } = useOwnerBatches(address);
  const batches = data?.batches || [];
  
  const recentBatches = [...batches].reverse().slice(0, 5);

  return (
    <Card className="border border-white/10 shadow-lg bg-slate-900/50 backdrop-blur-sm h-full">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            Recent Activity
            </CardTitle>
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-400">Live Feed</span>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
            <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 bg-slate-800/50 animate-pulse rounded-md" />
                ))}
            </div>
        ) : recentBatches.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
                <p className="text-sm">No recent activity</p>
            </div>
        ) : (
            <div className="flex flex-col">
                <AnimatePresence>
                    {recentBatches.map((batch, index) => (
                        <motion.div
                            key={batch.manufacturerBatchNo || batch._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <span className="font-mono text-xs font-medium text-slate-500 w-16 group-hover:text-teal-400 transition-colors">
                                    #{batch._id?.toString().slice(-4)}
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{batch.productName}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Qty: <span className="text-slate-400 font-medium">{batch.quantity}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <Badge 
                                className={`text-[10px] px-2 py-0.5 font-semibold tracking-wide border ${
                                    batch.status === 'CREATED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    (batch.status as string) === 'SOLD' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    batch.status === 'IN_TRANSIT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-slate-800 text-slate-400 border-white/10'
                                }`}
                            >
                                {batch.status}
                            </Badge>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
