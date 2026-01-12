import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { Package, DollarSign, AlertTriangle } from 'lucide-react'
import { batchApi } from '../../lib/api'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'

interface StatsData {
  totalBatches: number;
  inventoryValue: number;
  lowStockCount: number;
}

export function ManufacturerStats() {
  const { address } = useAccount()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    if (!address) return;
    
    setLoading(true)
    try {
      const response = await batchApi.getStats(address);
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch manufacturer stats:', error);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [address])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-900/50 animate-pulse rounded-xl border border-white/5" />
        ))}
      </div>
    )
  }

  if (!stats) return null;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {/* Card 1: Total Batches (Minted) */}
      <motion.div variants={item} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
        <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-blue-500/50 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Minted</p>
                <h3 className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.totalBatches}</h3>
                <p className="text-xs text-slate-500 mt-1">Total batches produced</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Card 2: Inventory Value */}
      <motion.div variants={item} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
        <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-emerald-500/50 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Est. Value</p>
                <h3 className="text-3xl font-bold text-emerald-400 shadow-emerald-500/50">
                  ${stats.inventoryValue.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Current inventory value</p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Card 3: Low Stock Alerts */}
      <motion.div variants={item} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
        <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-amber-500/50 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Alerts</p>
                <h3 className={`text-3xl font-bold ${stats.lowStockCount > 0 ? 'text-amber-400' : 'text-slate-500'} transition-colors`}>
                  {stats.lowStockCount} <span className="text-lg font-normal text-slate-500">Active</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Low stock warnings</p>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
