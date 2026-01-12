import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, usePublicClient, useChainId } from 'wagmi'
import { parseAbiItem } from 'viem'
import { keccak256, toUtf8Bytes, ethers } from 'ethers'
import axios from 'axios'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '../hooks/use-toast'
import { generateIdentityHash } from '../utils/hashUtils'
import { Users, Factory, Truck, Store, Copy, Check, Activity, ShieldCheck, X } from 'lucide-react'
import { CONTRACT_ADDRESS, DEPLOYMENT_BLOCK } from '../config/constants'
import SupplyChainArtifact from '../../../artifacts/contracts/PharmaChainV2.sol/PharmaChainV2.json'

// Role Hashes for counting
// Role Hashes for counting (Deprecated - using DB stats now)
// const MANUFACTURER_ROLE_HASH = ethers.keccak256(ethers.toUtf8Bytes('MANUFACTURER_ROLE'))
// const DISTRIBUTOR_ROLE_HASH = ethers.keccak256(ethers.toUtf8Bytes('DISTRIBUTOR_ROLE'))
// const PHARMACY_ROLE_HASH = ethers.keccak256(ethers.toUtf8Bytes('PHARMACY_ROLE'))

export default function AdminRequests() {
  const { address } = useAccount()
  const { toast } = useToast()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, manufacturers: 0, distributors: 0, pharmacies: 0 })
  const [copied, setCopied] = useState(false)

  const { writeContractAsync } = useWriteContract()

  // Fetch Pending Requests
  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/pending-users', {
        headers: { 'x-wallet-address': address }
      });
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests", error);
    }
  }

  // Fetch System Stats from Database
  const fetchStats = async () => {
    try {
        const res = await axios.get('http://localhost:3000/api/admin/stats', {
            headers: { 'x-wallet-address': address }
        });
        setStats(res.data);
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
  }

  useEffect(() => {
    if (address) {
      fetchRequests();
      fetchStats();
    }
  }, [address, publicClient])

  const copyToClipboard = () => {
      navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ description: "Contract Address copied to clipboard" });
  }

  const handleApprove = async (user: any) => {
    try {
      setLoading(true);
      toast({ title: "Processing Approval", description: "Verifying Identity PII..." })

      let roleString = "";
      if (user.requestedRole === 'MANUFACTURER') roleString = "MANUFACTURER_ROLE";
      else if (user.requestedRole === 'DISTRIBUTOR') roleString = "DISTRIBUTOR_ROLE";
      else if (user.requestedRole === 'PHARMACY') roleString = "PHARMACY_ROLE";
      else throw new Error("Invalid Role Requested");
      
      const roleHash = keccak256(toUtf8Bytes(roleString));
      const identityHash = user.identityHash || generateIdentityHash({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        physicalAddress: user.physicalAddress || '',
        licenseNumber: user.licenseNumber || ''
      });

      toast({ title: "Identity Verified", description: "Broadcasting to Blockchain..." });

      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: SupplyChainArtifact.abi,
        functionName: 'registerParticipant',
        args: [user.walletAddress, roleHash, identityHash],
      });

      toast({ title: "Transaction Sent", description: "Waiting for confirmation..." })
      
      await axios.put('http://localhost:3000/api/admin/update-status', {
        walletAddress: user.walletAddress,
        status: 'APPROVED'
      }, {
        headers: { 'x-wallet-address': address }
      });

      toast({ title: "Success", description: `User ${user.name} approved!`, className: "bg-teal-600 text-white" })
      fetchRequests();
      fetchStats(); // Update stats after approval

    } catch (error: any) {
      console.error("Approval failed", error);
      toast({ 
        title: "Approval Failed", 
        description: error.message || "Transaction rejected or failed", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false);
    }
  }

  const handleReject = async (user: any) => {
    try {
        await axios.put('http://localhost:3000/api/admin/update-status', {
            walletAddress: user.walletAddress,
            status: 'REJECTED'
          }, {
            headers: { 'x-wallet-address': address }
          });
          
          toast({ title: "User Rejected", description: `${user.name} has been rejected.` })
          fetchRequests();
    } catch (error) {
        toast({ title: "Error", description: "Failed to reject user", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto p-6 relative z-10 space-y-8">
        
        {/* 2. Header & System Status */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
            <div>
                <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-teal-500" />
                    Admin Command Center
                </h1>
                <p className="text-slate-400 mt-2 font-light text-lg">
                    Network oversight and participant validation.
                </p>
            </div>
            
            {/* Contract Address Widget (Glass Pill) */}
            <div className="flex items-center gap-3 bg-slate-900/80 border border-teal-500/30 rounded-full px-4 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                 <span className="text-teal-500 font-semibold text-xs uppercase tracking-wider">Smart Contract:</span>
                 <span className="text-teal-300 font-mono text-sm">
                     {chainId === 31337 ? "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" : CONTRACT_ADDRESS}
                 </span>
                 <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-teal-500/20 text-teal-400"
                 >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                 </Button>
            </div>
        </div>

        {/* 3. The Stats Grid (The HUD) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card className="bg-slate-900/50 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-300 group">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Network</p>
                        <p className="text-3xl font-bold text-white group-hover:text-blue-200 transition-colors">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5 group-hover:border-white/20 group-hover:scale-110 transition-all duration-300">
                        <Users className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                    </div>
                </CardContent>
            </Card>

            {/* Manufacturers */}
            <Card className="bg-slate-900/50 backdrop-blur border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Manufacturers</p>
                        <p className="text-3xl font-bold text-white group-hover:text-cyan-200 transition-colors">{stats.manufacturers}</p>
                    </div>
                    <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/20 group-hover:border-cyan-500/50 group-hover:scale-110 transition-all duration-300">
                        <Factory className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                    </div>
                </CardContent>
            </Card>

            {/* Distributors */}
            <Card className="bg-slate-900/50 backdrop-blur border border-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Distributors</p>
                        <p className="text-3xl font-bold text-white group-hover:text-purple-200 transition-colors">{stats.distributors}</p>
                    </div>
                    <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-500/20 group-hover:border-purple-500/50 group-hover:scale-110 transition-all duration-300">
                        <Truck className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                    </div>
                </CardContent>
            </Card>

            {/* Pharmacies */}
            <Card className="bg-slate-900/50 backdrop-blur border border-white/10 hover:border-emerald-500/30 transition-all duration-300 group">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Pharmacies</p>
                        <p className="text-3xl font-bold text-white group-hover:text-emerald-200 transition-colors">{stats.pharmacies}</p>
                    </div>
                    <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/20 group-hover:border-emerald-500/50 group-hover:scale-110 transition-all duration-300">
                        <Store className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* 4. Pending Registrations (The Table) */}
        <div className="space-y-4">
             <div className="flex items-center gap-3">
                 <h2 className="text-xl font-bold text-white">Pending Approvals</h2>
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-bold text-emerald-400 tracking-wide uppercase">Live Feed</span>
                 </div>
             </div>

            <Card className="bg-slate-900/60 border border-white/10 backdrop-blur-md overflow-hidden rounded-xl shadow-2xl">
                <Table>
                <TableHeader className="bg-slate-950 border-b border-white/10">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-teal-500 font-bold text-xs uppercase tracking-wider py-4 pl-6">Date</TableHead>
                        <TableHead className="text-teal-500 font-bold text-xs uppercase tracking-wider py-4">Wallet Address</TableHead>
                        <TableHead className="text-teal-500 font-bold text-xs uppercase tracking-wider py-4">Organization</TableHead>
                        <TableHead className="text-teal-500 font-bold text-xs uppercase tracking-wider py-4">Role Requested</TableHead>
                        <TableHead className="text-teal-500 font-bold text-xs uppercase tracking-wider py-4 text-right pr-6">Status / Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length === 0 ? (
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                        <TableCell colSpan={5} className="h-40 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                             <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
                                <Activity className="w-6 h-6 text-slate-600" />
                             </div>
                            <p className="text-sm font-light">All clear. No pending registration requests.</p>
                        </div>
                        </TableCell>
                    </TableRow>
                    ) : (
                    requests.map((req) => (
                        <TableRow key={req._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="pl-6 font-mono text-xs text-slate-400 group-hover:text-white transition-colors">
                                {new Date(req.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-500 group-hover:text-teal-400 transition-colors">
                                {req.walletAddress}
                            </TableCell>
                            <TableCell className="font-medium text-slate-300 text-sm group-hover:text-white">
                                {req.name}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-white/10 backdrop-blur-sm group-hover:border-teal-500/30 transition-colors">
                                    {req.requestedRole}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 space-x-3">
                                <Button 
                                    onClick={() => handleReject(req)}
                                    disabled={loading}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-3"
                                >
                                    <X className="w-4 h-4 mr-1.5" />
                                    Reject
                                </Button>
                                <Button 
                                    onClick={() => handleApprove(req)}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-900/20 border-0 h-8 px-4"
                                    size="sm"
                                >
                                    <Check className="w-4 h-4 mr-1.5" />
                                    Approve
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                    )}
                </TableBody>
                </Table>
            </Card>
        </div>
      </div>
    </div>
  )
}
