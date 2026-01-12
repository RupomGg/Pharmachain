import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useOwnerBatches } from '../../hooks/useBatches'
import { useAccount } from 'wagmi'
import { BarChart3, Loader2 } from 'lucide-react'

const CHART_PARAMS = { limit: 50 }; // Stabilize reference

export function InventoryOverviewChart() {
  const { address } = useAccount()
  const { data, isLoading } = useOwnerBatches(address, CHART_PARAMS)

  const chartData = useMemo(() => {
    if (!data?.batches) return []

    const aggregation: Record<string, number> = {}
    
    data.batches.forEach((batch: any) => {
      const name = batch.productName || 'Unknown'
      const qty = Number(batch.quantity) || 0
      aggregation[name] = (aggregation[name] || 0) + qty
    })

    return Object.entries(aggregation)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [data])

  return (
    <Card className="border border-white/10 shadow-lg bg-slate-900/50 backdrop-blur-sm h-full">
      <CardHeader className="pb-2 border-b border-white/5">
        <div className="flex items-center justify-between">
           <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
             <BarChart3 className="w-5 h-5 text-teal-400" />
             Stock Overview
           </CardTitle>
           <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Top 5 Products</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
               <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
               <p className="text-sm text-slate-400 font-medium">No inventory data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.5 }}
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    borderRadius: '12px', 
                    border: '1px solid #334155', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#2dd4bf', fontWeight: 600 }}
                />
                <defs>
                  <linearGradient id="tealGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <Bar 
                  dataKey="quantity" 
                  radius={[0, 4, 4, 0]} 
                  fill="url(#tealGradient)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
