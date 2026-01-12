import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi'; // Added useAccount
import { 
  Clock, ArrowRight, Activity 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { BrowserProvider, Contract } from 'ethers';

// Contract Config

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
import { API_URL } from '@/config/constants';

const ABI = [
  "function sendBatch(uint256 parentBatchId, address recipient, uint256 quantity) external returns (uint256)"
];

interface Order {
  _id: string;
  distributor: string;
  batchId: number;
  productName: string;
  quantityRequested: number; // Updated to match backend model
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function IncomingOrders() {
  const { address } = useAccount(); // Use wagmi hook
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (address) {
        fetchOrders();
    } else {
        setLoading(false);
    }
  }, [address]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/orders/received`, {
        headers: {
            'x-wallet-address': address || ''
        }
      });
      
      if (!response.ok) {
         throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (order: Order) => {
    try {
      setProcessingId(order._id);
      
      console.log("Approving order:", order);

      // 1. Connect to Wallet
      if (!window.ethereum) throw new Error("No crypto wallet found");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. Interact with Contract
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
      
      console.log("Contract instance:", contract);
      
      toast({
        title: "Initiating Transfer",
        description: "Please confirm the transaction in your wallet...",
      });

      if (typeof contract.sendBatch !== 'function') {
           throw new Error("Contract method 'sendBatch' not found. Check ABI or Contract Address.");
      }

      // Use quantityRequested here
      const qty = order.quantityRequested;
      if (qty === undefined || qty === null) {
          throw new Error("Order quantity is missing");
      }

      const tx = await contract.sendBatch(
          BigInt(order.batchId), 
          order.distributor, 
          BigInt(qty) 
      );
      
      console.log("Transaction sent:", tx.hash);

      toast({
        title: "Processing Block",
        description: "Waiting for confirmation...",
      });

      await tx.wait();

      // 3. Update Backend
      await fetch(`${API_URL}/orders/${order._id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': await signer.getAddress()
        },
        body: JSON.stringify({ txHash: tx.hash })
      });

      toast({
        title: "Success",
        description: `Batch sent! Transaction: ${tx.hash.slice(0, 8)}...`,
      });

      // Refresh list
      fetchOrders();

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error.message || "Unknown error occurred",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans selection:bg-teal-500/30">
        <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Incoming Orders</h1>
                    <p className="text-slate-400 mt-1">Manage stock requests from distributors</p>
                </div>
                <Button variant="outline" onClick={fetchOrders} className="border-teal-500/20 text-teal-400 hover:bg-teal-500/10">
                    <Activity className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium text-slate-200 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" /> Pending Approval
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {orders.length === 0 && !loading ? (
                        <div className="text-center py-12 text-slate-500">
                            No pending orders found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableHead className="text-slate-400">Request ID</TableHead>
                                    <TableHead className="text-slate-400">Distributor</TableHead>
                                    <TableHead className="text-slate-400">Item Details</TableHead>
                                    <TableHead className="text-slate-400">Quantity</TableHead>
                                    <TableHead className="text-slate-400">Value</TableHead>
                                    <TableHead className="text-right text-slate-400">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order._id} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {order._id.slice(-6).toUpperCase()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                <span className="font-mono text-xs text-slate-300 truncate w-32" title={order.distributor}>
                                                    {order.distributor}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-teal-400">{order.productName}</span>
                                            <div className="text-xs text-slate-500">Source Batch #{order.batchId}</div>
                                        </TableCell>
                                        <TableCell className="font-mono text-white">
                                            {order.quantityRequested} units
                                        </TableCell>
                                        <TableCell className="font-mono text-emerald-400">
                                            ${order.totalPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end group relative">
                                                <Button 
                                                    size="sm" 
                                                    className={`min-w-[140px] text-white ${
                                                        order.batchId === 0 
                                                        ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                                                        : 'bg-teal-600 hover:bg-teal-500'
                                                    }`}
                                                    onClick={() => handleApprove(order)}
                                                    disabled={!!processingId || order.batchId === 0}
                                                >
                                                    {processingId === order._id ? (
                                                        <span className="flex items-center gap-2 animate-pulse">
                                                            <Activity className="w-3 h-3 animate-spin" /> Processing...
                                                        </span>
                                                    ) : order.batchId === 0 ? (
                                                        <span className="flex items-center gap-2">
                                                            <Activity className="w-3 h-3 animate-pulse text-amber-500" /> Syncing Batch...
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            Approve & Send <ArrowRight className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </Button>
                                                
                                                {/* Tooltip for Syncing State */}
                                                {order.batchId === 0 && (
                                                    <div className="absolute bottom-full mb-2 right-0 w-64 p-2 bg-slate-800 text-xs text-slate-300 rounded border border-white/10 shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Batch ID is not yet confirmed on blockchain. Please wait for the backend to sync.
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>


                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

        </div>
    </div>
  );
}
