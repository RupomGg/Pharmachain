import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "../ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Loader2, Zap } from "lucide-react"
import { useAccount } from "wagmi"
import { useBulkBatchImport } from "../../hooks/useBulkBatchImport"
import { useToast } from "../ui/use-toast"

// Complete schema matching backend Batch model
const formSchema = z.object({
  batchNumber: z.string().min(2, "Batch number is required"),
  productName: z.string().min(2, "Product name is required"),
  productImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  dosageStrength: z.string().min(1, "Dosage strength is required (e.g. 500mg)"),
  dosageInstructions: z.string().min(1, "Dosage instructions are required"),
  packingType: z.string().min(1, "Packing type is required (e.g. Box)"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  baseUnit: z.string().min(1, "Base unit is required (e.g. Capsule, Tablet)"),
  packComposition: z.string().min(1, "Pack composition is required (e.g. 5 Strips x 4 Caps)"),
  totalUnitsPerPack: z.coerce.number().min(1, "Total units per pack required"),
  ingredients: z.string().min(1, "Active ingredients are required (separated by ;)"),
  storageTemp: z.string().min(1, "Storage temperature is required (e.g. 25C)"),
  baseUnitCost: z.coerce.number().min(0, "Base unit cost required"),
  baseUnitPrice: z.coerce.number().min(0, "Base unit price (MRP) required"),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
})

interface ManualEntryFormProps {
  onAddBatch: (data: any) => void;
}

export function ManualEntryForm({ onAddBatch }: ManualEntryFormProps) {
  const { address } = useAccount()
  
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchNumber: "",
      productName: "",
      productImage: "",
      dosageStrength: "",
      dosageInstructions: "",
      packingType: "Box",
      quantity: 1000,
      baseUnit: "Capsule",
      packComposition: "",
      totalUnitsPerPack: 20,
      ingredients: "",
      storageTemp: "25C",
      baseUnitCost: 0,
      baseUnitPrice: 0,
      expiryDate: "",
    },
  })

  // Hook for Direct Minting
  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const { uploadManualBatches, mintBatches, isProcessing, isPending, isConfirming } = useBulkBatchImport(CONTRACT_ADDRESS);
  const { toast } = useToast();

  // Helper for Regex Math Logic
  const calculateTotalUnits = (str: string) => {
    if (!str) return 1;
    const numbers = str.match(/\d+/g);
    return numbers ? numbers.reduce((acc, num) => acc * parseInt(num), 1) : 1;
  };

  const constructPayload = (values: any) => {
    return {
      ...values,
      manufacturerAddress: address,
      financials: {
        baseUnitCost: values.baseUnitCost,
        baseUnitPrice: values.baseUnitPrice,
        currency: 'USD'
      },
      totalUnitsPerPack: values.totalUnitsPerPack,
      totalBatchValue: values.quantity * values.totalUnitsPerPack * values.baseUnitPrice
    };
  }

  // Handler 1: Queue (Draft)
  function onAddToQueue(values: any) {
    const payload = constructPayload(values);
    onAddBatch(payload);
    form.reset({
      ...values, 
      batchNumber: "", // Clear unique field
    });
    toast({ title: "Added to Queue", description: "Batch draft created. Go to Bulk Import tab to finalize." });
  }

  // Handler 2: Mint Immediately
  async function onMintNow(values: any) {
    if (!address) {
        toast({ variant: "destructive", title: "Wallet not connected" });
        return;
    }

    try {
        const payload = constructPayload(values);
        
        // 1. Upload to IPFS & Create DB Draft
        const uploadRes = await uploadManualBatches([payload], address);
        
        if (!uploadRes.contractData) throw new Error("Failed to prepare contract data");

        // 2. Trigger Metamask
        await mintBatches(uploadRes.contractData);

        toast({ 
            title: "Minting Initiate!", 
            description: "Please confirm transaction in your wallet." 
        });

        // Form reset happens after success (handled by toast mostly, but we can clear specific fields)
        form.reset({
            ...values,
            batchNumber: "", 
        });

    } catch (e: any) {
        toast({ variant: "destructive", title: "Minting Failed", description: e.message });
    }
  }

  return (

    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8 bg-slate-900/50 backdrop-blur-md p-8 rounded-xl border border-white/10 relative overflow-hidden">

        
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500/50 via-teal-500 to-emerald-500/50" />

        {/* Section 1: Product Identification */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
             <div className="h-6 w-1 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
             <h4 className="font-bold text-teal-400 text-lg tracking-wide">Product Identification</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Batch Number (Internal ID)</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="BN-101" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productName"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Product Name</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Panadol Advance" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Expiry Date</FormLabel>
                  <FormControl>
                    <Input 
                        type="date" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20 [color-scheme:dark]"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="productImage"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel className="text-slate-400">Product Image URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://... or ipfs://..." 
                    {...field} 
                    className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20 font-mono text-sm"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Section 2: Dosage & Composition */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
             <div className="h-6 w-1 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
             <h4 className="font-bold text-teal-400 text-lg tracking-wide">Dosage & Composition</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="dosageStrength"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Dosage Strength</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="500mg" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storageTemp"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Storage Temperature</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="25C" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="dosageInstructions"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Dosage Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Take 1 tablet twice daily after meals" 
                        rows={2} 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Active Ingredients (separated by ;)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Paracetamol; Caffeine" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
          </div>
        </div>

        {/* Section 3: Packaging & Quantity */}
        <div className="space-y-6 pt-4">
           <div className="flex items-center gap-3 border-b border-white/10 pb-2">
             <div className="h-6 w-1 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
             <h4 className="font-bold text-teal-400 text-lg tracking-wide">Packaging & Quantity</h4>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="packingType"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Packing Type</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Box" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Quantity (Packs)</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20 font-mono"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseUnit"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Base Unit</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Capsule" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="packComposition"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Pack Composition</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="5 Strips x 4 Caps" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e); // default handler
                          const total = calculateTotalUnits(e.target.value);
                          form.setValue("totalUnitsPerPack", total);
                        }}
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  {/* Real-time Preview */}
                  {form.watch("packComposition") && (
                     <div className="text-xs text-teal-400 mt-1 font-mono tracking-wider">
                        Total: {form.watch("totalUnitsPerPack")} {form.watch("baseUnit") || 'Units'}
                     </div>
                  )}
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalUnitsPerPack"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Total Units Per Pack (Auto)</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        placeholder="20" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20 font-mono"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 4: Pricing Information */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
             <div className="h-6 w-1 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
             <h4 className="font-bold text-teal-400 text-lg tracking-wide">Pricing Information (Private)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="baseUnitCost"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Base Unit Cost ($)</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Cost per capsule" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20 font-mono"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseUnitPrice"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Base Unit Price - MRP ($)</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="MRP per capsule" 
                        {...field} 
                        className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20 font-mono"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="pt-6 flex justify-end border-t border-white/10">

            <Button 
                type="button" 
                size="lg" 
                variant="secondary"
                onClick={form.handleSubmit(onAddToQueue)}
                className="flex-1 bg-slate-800 text-white hover:bg-slate-700 font-bold border border-white/10"
            >
                Add to Queue (Draft)
            </Button>

            <Button 
                type="button"
                size="lg"
                disabled={isProcessing}
                onClick={form.handleSubmit(onMintNow)}
                className="flex-[2] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all rounded-lg"
            >
                {isProcessing ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isPending ? "Confirm Wallet..." : isConfirming ? "Minting..." : "Processing..."}
                    </span>
                 ) : (
                    <span className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Mint Batch Now
                    </span>
                 )}
            </Button>
        </div>


      </form>
    </Form>
  )
}
