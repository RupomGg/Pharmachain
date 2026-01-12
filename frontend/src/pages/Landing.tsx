import { useState, type FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Package, Search, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRole } from '../hooks/useRole'

export function Landing() {
  const { address, isConnected } = useAccount()
  const { isManufacturer, isDistributor } = useRole()
  const [searchId, setSearchId] = useState('')
  const navigate = useNavigate()

  // Auto-redirect if connected and has role
  useEffect(() => {
    if (isConnected && address) {
      if (isManufacturer) {
        navigate('/manufacturer')
      } else if (isDistributor) {
        navigate('/distributor')
      }
    }
  }, [isConnected, isManufacturer, isDistributor, address, navigate])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    if (searchId && !isNaN(Number(searchId))) {
      navigate(`/product/${searchId}`)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left: Visual */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-white text-center"
        >
          <Package className="w-32 h-32 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">PharmaChain</h1>
          <p className="text-xl">Transparent Supply Chain Tracking</p>
          <p className="text-sm mt-4 opacity-80">Powered by Blockchain Technology</p>
        </motion.div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Product Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-4">Search Product</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <input
                type="number"
                placeholder="Enter Batch ID"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search Product
              </button>
            </form>
          </motion.div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or connect wallet
              </span>
            </div>
          </div>

          {/* Wallet Connect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="w-full border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </motion.div>

          {/* Role-based redirect info */}
          {isConnected && (
            <div className="text-sm text-center text-muted-foreground animate-pulse">
              Redirecting to your dashboard...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
