import { useState, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Factory, Truck, Building2, RefreshCw } from 'lucide-react'
import { ethers } from 'ethers'

import { CONTRACT_ADDRESS, DEPLOYMENT_BLOCK } from '../../config/constants'
import { usePublicClient } from 'wagmi'

export function BlockchainStats() {
  const publicClient = usePublicClient()

  // Get contract instance to query events
  const getRegistrationStats = async () => {
    try {
      if (!publicClient) return { total: 0, manufacturers: 0, distributors: 0, pharmacies: 0 };

      // Query all ParticipantRegistered events
      // Using viem/wagmi logs instead of ethers for consistency with the rest of the app if possible, 
      // but keeping ethers logic if preferred. 
      // Actually, let's keep it simple: Use the publicClient to get logs.
      
      const latestBlock = await publicClient.getBlockNumber()
      const fromBlock = BigInt(DEPLOYMENT_BLOCK)
      const chunkSize = 1000n // Limit to 1000 blocks per request to avoid RPC limits
      const logs = []

      for (let i = fromBlock; i <= latestBlock; i += chunkSize) {
        const toBlock = i + chunkSize - 1n < latestBlock ? i + chunkSize - 1n : latestBlock
        
        const chunkLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: {
            type: 'event',
            name: 'ParticipantRegistered',
            inputs: [{ type: 'address', name: 'participant', indexed: true }, { type: 'bytes32', name: 'role' }, { type: 'bytes32', name: 'identityHash' }]
          },
          fromBlock: i,
          toBlock: toBlock
        })
        logs.push(...chunkLogs)
      }

      // Categorize by role
      // Re-using ethers for hashing to be safe
      const MANUFACTURER_ROLE_HASH = ethers.keccak256(ethers.toUtf8Bytes('MANUFACTURER_ROLE'))
      const DISTRIBUTOR_ROLE_HASH = ethers.keccak256(ethers.toUtf8Bytes('DISTRIBUTOR_ROLE'))
      const PHARMACY_ROLE_HASH = ethers.keccak256(ethers.toUtf8Bytes('PHARMACY_ROLE'))

      const stats = {
        total: logs.length,
        manufacturers: 0,
        distributors: 0,
        pharmacies: 0
      }

      logs.forEach((log: any) => {
        const role = log.args.role
        if (role === MANUFACTURER_ROLE_HASH) stats.manufacturers++
        else if (role === DISTRIBUTOR_ROLE_HASH) stats.distributors++
        else if (role === PHARMACY_ROLE_HASH) stats.pharmacies++
      })

      return stats
    } catch (error) {
      console.error('Error fetching blockchain stats:', error)
      return { total: 0, manufacturers: 0, distributors: 0, pharmacies: 0 }
    }
  }




  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    const data = await getRegistrationStats()
    setStats(data)
    setLoading(false)
  }

  // Fetch on mount
  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <Card className="border-teal-200">
      <CardHeader className="bg-teal-50 border-b border-teal-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-teal-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Blockchain Registration Stats
            </CardTitle>
            <CardDescription className="mt-1">
              Live data from PharmaChainV2 contract
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="border-teal-300 hover:bg-teal-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!stats ? (
          <div className="text-center py-8 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading statistics...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-600">Total</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            </div>

            {/* Manufacturers */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Factory className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Manufacturers</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{stats.manufacturers}</div>
            </div>

            {/* Distributors */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Distributors</span>
              </div>
              <div className="text-3xl font-bold text-purple-900">{stats.distributors}</div>
            </div>

            {/* Pharmacies */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Pharmacies</span>
              </div>
              <div className="text-3xl font-bold text-green-900">{stats.pharmacies}</div>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500 text-center">
          Contract: {CONTRACT_ADDRESS.substring(0, 10)}...{CONTRACT_ADDRESS.substring(38)}
        </div>
      </CardContent>
    </Card>
  )
}
