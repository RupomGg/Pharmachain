import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi'; // Added useAccount
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ShoppingCart, Package, 
  Thermometer, ShieldCheck, Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// Types
interface Batch {
  _id: string; 
  batchId: number;
  productName: string;
  manufacturer: string;
  quantity: number;
  packingType: string; // Updated from unit
  totalUnitsPerPack: number;
  productImage?: string;
  expiryDate?: string;
  baseUnitPrice?: number; 
}

export default function MarketplacePage() {
  const { address } = useAccount(); // Use wagmi hook
  const [batches, setBatches] = useState<Batch[]>([]);

  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const { toast } = useToast();

  const fetchMarketplace = useCallback(async (signal?: AbortSignal) => {
    if (!address) return;
    
    try {

      
      const query = search ? `?search=${search}` : '';
      const response = await fetch(`http://localhost:3000/api/orders/marketplace${query}`, {
        headers: {
            'x-wallet-address': address || ''
        },
        signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch marketplace: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setBatches(data);
      } else {
        console.error("Marketplace data is not an array:", data);
        setBatches([]);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error("Failed to fetch marketplace", error);
    } finally {

    }
  }, [address, search]);

  useEffect(() => {
    const controller = new AbortController();
    
    // Debounce the call to prevent rapid firing on search input
    const timeoutId = setTimeout(() => {
        if (address) {
            fetchMarketplace(controller.signal);
        } else {

        }
    }, 300); // 300ms debounce

    return () => {
        clearTimeout(timeoutId);
        controller.abort();
    };
  }, [fetchMarketplace, address]);

  const handleOrder = async () => {
    if (!selectedBatch) return;

    try {
      if (!address) throw new Error("Wallet not connected");

      // Calculate logic
      const unitsPerPack = selectedBatch.totalUnitsPerPack || 1;
      const basePrice = selectedBatch.baseUnitPrice || 0;
      const packPrice = basePrice * unitsPerPack;
      const finalTotalPrice = orderQuantity * packPrice;

      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address
        },
        body: JSON.stringify({
          manufacturer: selectedBatch.manufacturer,
          batchId: selectedBatch.batchId,
          quantityRequested: orderQuantity, // Ordering in Packs
          totalPrice: finalTotalPrice,
          productName: selectedBatch.productName
        })
      });

      if (response.ok) {
        toast({
          title: "Order Placed Successfully",
          description: "Manufacturer has been notified.",
        });
        setSelectedBatch(null);
        setOrderQuantity(1); // Reset
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "Please try again later.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans selection:bg-teal-500/30">
        
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
                    Global Marketplace
                </h1>
                <p className="text-slate-400 mt-1">Sourcing Verified Pharmaceutical Supplies</p>
            </div>
            
            {/* Search & Filter */}
            <div className="flex w-full md:w-auto gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search medicines..." 
                        className="bg-transparent border-none pl-9 h-10 focus-visible:ring-0 placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
                    <Filter className="w-4 h-4" />
                </Button>
            </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
                {Array.isArray(batches) && batches.map((batch) => {
                    const unitsPerPack = batch.totalUnitsPerPack || 1;
                    const basePrice = batch.baseUnitPrice || 0;
                    const packPrice = basePrice * unitsPerPack;
                    
                    return (
                    <motion.div
                        key={batch._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="bg-slate-900/40 border-white/10 overflow-hidden hover:border-teal-500/50 group transition-all duration-300">
                            {/* Image Area */}
                            <div className="h-48 relative bg-slate-900 overflow-hidden">
                                {batch.productImage ? (
                                    <img src={batch.productImage} alt={batch.productName} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                                        <Box className="w-16 h-16" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <Badge className="bg-slate-950/80 backdrop-blur border border-white/10 text-teal-400 hover:bg-slate-900">
                                        {batch.quantity} {batch.packingType || 'Unit'}s Available
                                    </Badge>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <CardContent className="p-5">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-teal-400 transition-colors">{batch.productName}</h3>
                                    <p className="text-sm text-slate-500 truncate">Mfr: {batch.manufacturer}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 mb-4">
                                     <div className="flex items-center gap-2 bg-slate-950/50 p-2 rounded">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified
                                     </div>
                                     <div className="flex items-center gap-2 bg-slate-950/50 p-2 rounded">
                                        <Thermometer className="w-3 h-3 text-amber-500" /> 2-8°C
                                     </div>
                                </div>
                                <div className="text-lg font-bold text-teal-400 mb-2">
                                    ${packPrice.toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ {batch.packingType || 'pack'} ({unitsPerPack} units)</span>
                                </div>
                            </CardContent>

                            <CardFooter className="p-5 pt-0">
                                <Button 
                                    className="w-full bg-slate-800 hover:bg-teal-600 hover:text-white border border-white/5 transition-all group-hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                                    onClick={() => setSelectedBatch(batch)}
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" /> Place Order
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )})}
            </AnimatePresence>
        </div>

        {/* Order Modal */}
        <Dialog open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
            <DialogContent className="bg-slate-950 border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Place Order</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Requesting inventory from {selectedBatch?.manufacturer.slice(0, 10)}...
                    </DialogDescription>
                </DialogHeader>
                
                {selectedBatch && (() => {
                     const unitsPerPack = selectedBatch.totalUnitsPerPack || 1;
                     const basePrice = selectedBatch.baseUnitPrice || 0;
                     const packPrice = basePrice * unitsPerPack;
                     
                     return (
                    <div className="space-y-6 py-4">
                        <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-white/5">
                            <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-teal-500" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">{selectedBatch.productName}</p>
                                <p className="text-sm text-slate-500">Batch #{selectedBatch._id}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Quantity Required ({selectedBatch.packingType || 'Pack'}s)</Label>
                                <div className="flex items-center gap-4">
                                    <Input 
                                        type="number" 
                                        value={orderQuantity}
                                        onChange={(e) => setOrderQuantity(Number(e.target.value))}
                                        min="1"
                                        max={selectedBatch.quantity}
                                        className="bg-slate-900 border-white/10 text-lg"
                                    />
                                    <span className="text-slate-500 text-sm whitespace-nowrap">
                                        / {selectedBatch.quantity} {selectedBatch.packingType || 'Pack'}s
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Contains {unitsPerPack} units per {selectedBatch.packingType || 'pack'}
                                </p>
                            </div>

                            <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-4 flex justify-between items-center">
                                <div>
                                    <div className="text-teal-400 text-sm">Estimated Total</div>
                                    <div className="text-xs text-slate-400">${packPrice.toFixed(2)} x {orderQuantity}</div>
                                </div>
                                <span className="text-xl font-mono font-bold text-teal-400">
                                    ${(orderQuantity * packPrice).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )})()}

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setSelectedBatch(null)}>Cancel</Button>
                    <Button onClick={handleOrder} className="bg-teal-500 hover:bg-teal-600 text-white">
                        Confirm Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
