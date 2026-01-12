import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Building2, MapPin, Phone, Wallet, Network, FileText } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { API_URL } from '../../config/constants'

interface UserDetails {
  walletAddress: string
  name: string
  email: string
  role: string
  phone: string
  physicalAddress: string
  licenseNumber: string
  status: string
}

export function UserProfileCard() {
  const { address, chain } = useAccount()
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!address) {
        setLoading(false)
        return
      }

      try {
        const res = await axios.get(`${API_URL}/users/${address}`)
        setUserDetails(res.data)
      } catch (error) {
        console.error('Failed to fetch user details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [address])

  if (loading) {
    return (
      <Card className="border-2 border-teal-500/20 max-w-2xl">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Loading your details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userDetails) {
    return (
      <Card className="border-2 border-teal-500/20 max-w-2xl">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>No profile found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load your profile information.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-teal-500/30 bg-slate-900/60 backdrop-blur-md h-full shadow-[0_0_20px_rgba(20,184,166,0.1)]">
      <CardHeader className="pb-6 border-b border-teal-500/20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white tracking-wide">Profile Information</CardTitle>
            <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold rounded-full shadow-[0_0_10px_rgba(20,184,166,0.3)]">
              {userDetails.role}
            </div>
          </div>
          <CardDescription className="text-slate-400">
            Authorized Distributor Account
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Organization Name */}
        <div className="group flex items-center gap-4 p-3 rounded-xl bg-slate-950/50 border border-white/5 hover:border-teal-500/30 hover:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300">
          <div className="p-2.5 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
            <Building2 className="w-5 h-5 text-teal-400 group-hover:text-teal-300 drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Organization</p>
            <p className="font-medium text-slate-200 truncate group-hover:text-white transition-colors">{userDetails.name}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent my-2" />

        {/* Email */}
        <div className="group flex items-center gap-4 p-3 rounded-xl bg-slate-950/50 border border-white/5 hover:border-teal-500/30 hover:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300">
          <div className="p-2.5 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
            <Mail className="w-5 h-5 text-teal-400 group-hover:text-teal-300 drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]" />
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Email</p>
            <p className="font-medium text-slate-200 truncate group-hover:text-white transition-colors">{userDetails.email}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="group flex items-center gap-4 p-3 rounded-xl bg-slate-950/50 border border-white/5 hover:border-teal-500/30 hover:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300">
          <div className="p-2.5 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
            <Phone className="w-5 h-5 text-teal-400 group-hover:text-teal-300 drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]" />
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Phone</p>
            <p className="font-medium text-slate-200 group-hover:text-white transition-colors">{userDetails.phone}</p>
          </div>
        </div>

        {/* Physical Address */}
        <div className="group flex items-start gap-4 p-3 rounded-xl bg-slate-950/50 border border-white/5 hover:border-teal-500/30 hover:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300">
          <div className="p-2.5 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors mt-1">
            <MapPin className="w-5 h-5 text-teal-400 group-hover:text-teal-300 drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]" />
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Address</p>
            <p className="font-medium text-slate-200 text-sm leading-relaxed group-hover:text-white transition-colors">{userDetails.physicalAddress}</p>
          </div>
        </div>

        {/* License Number */}
        {userDetails.licenseNumber && (
          <div className="group flex items-center gap-4 p-3 rounded-xl bg-slate-950/50 border border-white/5 hover:border-teal-500/30 hover:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300">
            <div className="p-2.5 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
              <FileText className="w-5 h-5 text-teal-400 group-hover:text-teal-300 drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">License</p>
              <p className="font-mono text-slate-200 group-hover:text-white transition-colors">{userDetails.licenseNumber}</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent my-2" />

        {/* Wallet Address */}
        <div className="group p-4 rounded-xl bg-slate-950/80 border border-teal-500/20 hover:border-teal-500/40 hover:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300">
           <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-4 h-4 text-teal-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wider">Connected Wallet</p>
           </div>
           <p className="font-mono text-xs text-teal-400 break-all">{userDetails.walletAddress}</p>
        </div>

        {/* Network Info */}
        {chain && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-white/5">
             <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">{chain.name}</span>
             </div>
             <ConnectButton.Custom>
                {({ openChainModal }) => (
                  <Button
                    onClick={openChainModal}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 hover:bg-teal-500/10 hover:text-teal-400"
                  >
                    Switch
                  </Button>
                )}
              </ConnectButton.Custom>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
