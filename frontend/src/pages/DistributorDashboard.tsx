import { useState, useEffect } from 'react'
import { Package, TrendingUp, Clock, Archive, ShoppingCart, FileText } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useOwnerBatches } from '../hooks/useBatches'
import { API_URL } from '../config/constants'

import { UserProfileCard } from '../components/dashboard/UserProfileCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function DistributorDashboard() {
  const { address } = useAccount()
  const navigate = useNavigate()
  const { data: batchesData } = useOwnerBatches(address)
  const [orders, setOrders] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const batches = batchesData?.batches || []
  const totalBatches = batches.length
  const delivered = batches.filter(b => b.status === 'DELIVERED').length

  useEffect(() => {
    if (address) fetchOrders()
  }, [address])

  const fetchOrders = async () => {
    setError(null)
    try {
      const response = await fetch(`${API_URL}/orders/sent`, {
         headers: { 'x-wallet-address': address || '' }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data)) {
        console.warn("Received invalid orders data:", data)
        setOrders([])
        // Optional: show error or just fallback to empty
        return
      }
      
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch orders", error)
      setError("Failed to load orders. Please try again later.")
      setOrders([])
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Main Content (Left Column - Spans 3) */}
            <div className="lg:col-span-3 space-y-8">
                
                {/* 2. Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-lg shadow-black/5">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            Distributor Dashboard
                        </h1>
                        <p className="text-slate-400 mt-2 font-light">
                            Manage inventory, track orders, and browse the marketplace.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        {/* Secondary Button: Inventory */}
                        <Button
                            onClick={() => navigate('/distributor/inventory')}
                            variant="outline"
                            className="h-12 px-6 border-indigo-500/50 text-indigo-300 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-400 bg-transparent backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300 group"
                        >
                            <Package className="w-5 h-5 mr-2 group-hover:text-indigo-400 transition-colors" /> 
                            Manage Inventory
                        </Button>

                        {/* Primary Button: Marketplace */}
                        <Button 
                            onClick={() => navigate('/marketplace')} 
                            className="h-12 px-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white border-0 shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:shadow-[0_0_30px_rgba(45,212,191,0.6)] transition-all duration-300 group"
                        >
                            <ShoppingCart className="w-5 h-5 mr-2 group-hover:animate-pulse" /> 
                            Browse Marketplace
                        </Button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)] flex items-center gap-3 backdrop-blur-sm">
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div>
                )}

                {/* 4. Stats Cards (Top Right Row) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Total Inventory */}
                    <Card className="bg-slate-900/60 border-teal-500/30 backdrop-blur-md relative overflow-hidden group hover:border-teal-400/50 transition-all duration-500 shadow-lg shadow-teal-900/20">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/20 rounded-full blur-xl group-hover:bg-teal-500/30 transition-all duration-500" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-teal-300 uppercase tracking-wider">Total Inventory</p>
                                <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                                    <Archive className="w-6 h-6 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-200 drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]">
                                    {totalBatches}
                                </p>
                                <p className="text-xs text-slate-400 mt-1 font-mono">Batches Verified On-Chain</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Pending Orders */}
                    <Card className="bg-slate-900/60 border-amber-500/30 backdrop-blur-md relative overflow-hidden group hover:border-amber-400/50 transition-all duration-500 shadow-lg shadow-amber-900/20">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full blur-xl group-hover:bg-amber-500/30 transition-all duration-500" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-amber-300 uppercase tracking-wider">Pending Orders</p>
                                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                                    <Clock className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                                    {orders.filter(o => o.status === 'PENDING').length}
                                </p>
                                <p className="text-xs text-slate-400 mt-1 font-mono">Awaiting Manufacturer Approval</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Received */}
                    <Card className="bg-slate-900/60 border-emerald-500/30 backdrop-blur-md relative overflow-hidden group hover:border-emerald-400/50 transition-all duration-500 shadow-lg shadow-emerald-900/20">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-emerald-300 uppercase tracking-wider">Received</p>
                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                    <TrendingUp className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                                    {delivered}
                                </p>
                                <p className="text-xs text-slate-400 mt-1 font-mono">Successful Shipments</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 5. Order History Table (Bottom Right) */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" /> 
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Order History</span>
                    </h2>
                    
                    <Card className="bg-slate-900/60 border-teal-500/20 backdrop-blur-md overflow-hidden shadow-2xl shadow-black/50">
                        <Table>
                            <TableHeader className="bg-slate-900/80 border-b border-teal-500/20">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="text-cyan-400 font-mono text-xs uppercase tracking-wider py-4">Order ID</TableHead>
                                    <TableHead className="text-cyan-400 font-mono text-xs uppercase tracking-wider py-4">Product</TableHead>
                                    <TableHead className="text-cyan-400 font-mono text-xs uppercase tracking-wider py-4">Quantity</TableHead>
                                    <TableHead className="text-cyan-400 font-mono text-xs uppercase tracking-wider py-4">Total Price</TableHead>
                                    <TableHead className="text-cyan-400 font-mono text-xs uppercase tracking-wider py-4">Status</TableHead>
                                    <TableHead className="text-cyan-400 font-mono text-xs uppercase tracking-wider text-right py-4">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-2">
                                                    <ShoppingCart className="w-6 h-6 text-slate-600" />
                                                </div>
                                                <p>No orders placed yet.</p>
                                                <Button variant="link" onClick={() => navigate('/marketplace')} className="text-teal-400 hover:text-teal-300">
                                                    Go to Marketplace
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => (
                                        <TableRow key={order._id} className="group hover:bg-teal-500/5 border-b border-white/5 transition-all duration-300 relative">
                                            {/* Hover Glow Effect */}
                                            <div className="absolute inset-y-0 left-0 w-1 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            <TableCell className="font-mono text-xs text-slate-400 group-hover:text-white transition-colors">
                                                {order._id.slice(-6).toUpperCase()}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-200 group-hover:text-teal-200 transition-colors">
                                                {order.productName}
                                            </TableCell>
                                            <TableCell className="text-slate-400 font-mono">
                                                {order.quantity} <span className="text-xs opacity-50">units</span>
                                            </TableCell>
                                            <TableCell className="font-mono text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.2)]">
                                                ${order.totalPrice.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`
                                                    backdrop-blur-md shadow-lg border px-3 py-1 font-bold tracking-wide
                                                    ${order.status === 'PENDING' ? 'border-amber-500/50 text-amber-300 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : ''}
                                                    ${order.status === 'COMPLETED' ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : ''}
                                                    ${order.status === 'REJECTED' ? 'border-red-500/50 text-red-300 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}
                                                `}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 text-xs font-mono">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>

            {/* Profile Sidebar (Right Column - Spans 1) */}
            <div className="lg:col-span-1 space-y-6">
                <UserProfileCard />
                
                {/* System Status Card */}
                <div className="rounded-xl border border-teal-500/30 bg-slate-900/60 backdrop-blur-md p-4 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-sm font-bold text-white flex items-center gap-2">
                             <TrendingUp className="w-4 h-4 text-emerald-400" />
                             System Status
                         </h3>
                         <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] h-5 px-1.5 flex items-center gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             STABLE
                         </Badge>
                    </div>
                    <div className="space-y-4">
                        <div>
                             <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Network</p>
                             <div className="flex items-center justify-between">
                                 <p className="text-lg font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Sepolia Testnet</p>
                                 <span className="text-[10px] font-mono text-slate-600">ID: 11155111</span>
                             </div>
                        </div>
                        <Button className="w-full bg-slate-950/50 border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:border-teal-400/50 transition-all text-xs h-8">
                            Switch Network
                        </Button>
                        <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] text-slate-600 font-mono">
                            <span>15:45:02</span>
                            <span>• System Online</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}
