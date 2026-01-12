import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Building2, Mail, Phone, MapPin, FileText, Wallet, Network } from 'lucide-react'
import { useAccount, useChainId } from 'wagmi'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../../config/constants'

export function FactoryProfileCard() {
  const { address } = useAccount()
  const chainId = useChainId()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
     const fetchProfile = async () => {
         if (!address) return;
         try {
             // 1. Fetch User Data
             const userRes = await axios.get(`${API_URL}/users/${address}`);
             const userData = userRes.data;
             
             setProfile({
                 name: userData.name || 'Unknown Manufacturer',
                 role: userData.role || 'MANUFACTURER',
                 // Fallback or future fields. Currently schema might just have name/role/status.
                 // We'll show defaults if these extended fields aren't in DB yet, 
                 // but at least Name and Role will be real.
                 email: userData.email || 'N/A',
                 phone: userData.phone || 'N/A',
                 location: userData.location || 'N/A',
                 license: userData.licenseNumber || 'N/A'
             });
         } catch (e) {
             console.error("Failed to fetch profile", e);
         }
     };
     fetchProfile();
  }, [address]);

  const getNetworkName = (id: number) => {
      if (id === 11155111) return 'Sepolia Testnet';
      if (id === 1) return 'Ethereum Mainnet';
      if (id === 31337) return 'Hardhat Local';
      return 'Unknown Network';
  }

  return (
    <div className="flex flex-col gap-6 sticky top-6">
      <Card className="border border-white/5 shadow-lg bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-500" />
        <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 relative border-b border-white/5">
            <div className="absolute -bottom-10 left-6">
                <div className="h-20 w-20 rounded-xl bg-slate-900 p-1 shadow-2xl border border-white/10">
                   <div className="h-full w-full bg-slate-800 rounded-lg flex items-center justify-center border border-white/5">
                      <Building2 className="w-8 h-8 text-teal-400" />
                   </div>
                </div>
            </div>
            <div className="absolute top-4 right-4">
                <Badge className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 backdrop-blur-sm">
                    {profile?.role || 'MANUFACTURER'}
                </Badge>
            </div>
        </div>
        
        <CardContent className="pt-12 px-6 pb-6">
           <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">{profile?.name || 'Loading...'}</h2>
              <p className="text-sm text-slate-400">Registered Manufacturer</p>
           </div>

           <div className="space-y-5">
              <div className="flex items-center gap-3 text-sm group">
                 <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-teal-500/30 transition-colors">
                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-xs text-slate-500">Contact Email</p>
                    <p className="text-slate-200 font-medium truncate">{profile?.email || 'Not set'}</p>
                 </div>
              </div>

              <div className="flex items-center gap-3 text-sm group">
                 <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-teal-500/30 transition-colors">
                    <Phone className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                 </div>
                 <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-slate-200 font-medium">{profile?.phone || 'Not set'}</p>
                 </div>
              </div>

               <div className="flex items-center gap-3 text-sm group">
                 <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-teal-500/30 transition-colors">
                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                 </div>
                 <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-slate-200 font-medium">{profile?.location || 'Not set'}</p>
                 </div>
              </div>

              <div className="flex items-center gap-3 text-sm group">
                 <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-teal-500/30 transition-colors">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                 </div>
                 <div>
                    <p className="text-xs text-slate-500">License No.</p>
                    <p className="text-slate-200 font-mono">{profile?.license || 'Pending'}</p>
                 </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5">
                 <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/20">
                        <Wallet className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs text-slate-500">Connected Wallet</p>
                        <p className="text-slate-200 font-mono text-xs truncate">
                            {address || 'Not Connected'}
                        </p>
                    </div>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* Network Switcher Card */}
      <Card className="border border-white/10 shadow-lg bg-black/40 backdrop-blur-md text-white overflow-hidden relative group">
         <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
         <CardContent className="p-5 relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-medium text-slate-300">System Status</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                     <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">Stable</span>
                </div>
            </div>
            
            <div className="mb-4 pl-1 border-l-2 border-teal-500/50">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Current Network</p>
                <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-white">{getNetworkName(chainId)}</p>
                    <p className="text-xs font-mono text-slate-500">ID: {chainId}</p>
                </div>
            </div>

            <Button className="w-full bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 hover:border-teal-500/50 transition-all">
                Switch Network
            </Button>
         </CardContent>
      </Card>
      
      <div className="text-center">
          <p className="text-xs text-slate-600 font-mono">
              {currentTime.toLocaleTimeString()} • System Online
          </p>
      </div>
    </div>
  )
}
