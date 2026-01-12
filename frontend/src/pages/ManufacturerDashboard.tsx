import { motion } from 'framer-motion'
import { ManufacturerStats } from '../components/stats/ManufacturerStats'
import { RecentBatchesFeed } from '../components/dashboard/RecentBatchesFeed'
import { FactoryProfileCard } from '../components/dashboard/FactoryProfileCard'
import { InventoryOverviewChart } from '../components/dashboard/InventoryOverviewChart'
import { Plus, Package, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function ManufacturerDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container mx-auto p-4 md:p-6 max-w-[1600px] relative z-10">
        
        {/* HEADER WITH QUICK ACTIONS */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/5 pb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-bold text-white tracking-tight">Factory Command Center</h1>
               <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Network Online
               </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span>Real-time production monitoring</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span className="text-teal-400">System v2.4.0</span>
            </div>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/manufacturer/create')}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(13,148,136,0.3)] border-0 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Production
            </Button>
            <Button 
              onClick={() => navigate('/manufacturer/orders')}
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Incoming Orders
            </Button>
            <Button 
              onClick={() => navigate('/manufacturer/inventory')}
              variant="outline"
              className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:border-white/20 transition-all"
            >
              <Package className="w-4 h-4 mr-2" />
              Manage Stock
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          
          {/* --- LEFT COLUMN (Metrics & Charts) --- */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              
              {/* Zone A: Production Stats (The Pulse) */}
              <ManufacturerStats />

              {/* Zone B: Stock Overview (The Chart) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-[380px]"
              >
                 <InventoryOverviewChart />
              </motion.div>

              {/* Zone C: Recent Activity (The Feed) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="min-h-[400px]"
              >
                  <RecentBatchesFeed />
              </motion.div>
          </div>

          {/* --- RIGHT COLUMN (Profile Only) --- */}
          <div className="col-span-12 lg:col-span-4">
              {/* User Profile */}
              <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
              >
                  <FactoryProfileCard />
              </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
