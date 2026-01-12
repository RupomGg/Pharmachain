import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ethers } from 'ethers'
import { useAccount, useSignMessage } from 'wagmi'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import axios from 'axios'

// Zod Schema for PII
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
  address: z.string().min(10, "Address is too short"),
  taxId: z.string().min(5, "Tax ID is required"),
})

type FormData = z.infer<typeof formSchema>

export function RegistrationForm() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [_isRegistered, setIsRegistered] = useState(false)
  /* eslint-enable @typescript-eslint/no-unused-vars */ 
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'APPROVED'>('IDLE') 

  useEffect(() => {
    const checkStatus = async () => {
        if (!address) return;
        try {
            const res = await axios.get(`http://localhost:3000/api/users/${address}`);
            if (res.data) {
                setStatus(res.data.status);
                if (res.data.status === 'PENDING' || res.data.status === 'APPROVED') {
                    setIsRegistered(true);
                }
            }
        } catch (e) {
            // User not found, stay IDLE
        }
    }
    checkStatus();
  }, [address]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: FormData) => {
    if (!address) return
    setIsSubmitting(true)

    try {
      // 1. Create a deterministic string to hash
      const piiString = JSON.stringify({
        fullName: data.fullName,
        taxId: data.taxId,
      })

      // 2. Compute Identity Hash locally
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes(piiString))

      // 3. Sign the hash to prove ownership
      const signature = await signMessageAsync({
        message: `Registering Identity for PharmaChain.\nHash: ${identityHash}`
      })

      // 4. Send to Backend
      // Role is hardcoded for this form as MANUFACTURER for now, or we can add a selector. 
      // User requested "Admin Approval" flow, usually implies they select a role or default to something.
      // I'll default to MANUFACTURER or add a selector. For MVP, let's hardcode 'MANUFACTURER' or deriving from context?
      // The user request said "Show Home, Search. Badge: Pending Approval."
      // The previous prompt mentioned "Role Requested" in the Admin table.
      // I will add a default role or let them choose. Let's start with MANUFACTURER as default.
      
      const response = await axios.post('http://localhost:3000/api/users/register', { 
         walletAddress: address, 
         name: data.fullName, 
         requestedRole: 'MANUFACTURER', // Defaulting for now
         identityHash, 
         signature 
      })
      
      console.log('Backend Response:', response.data)
      
      setStatus('PENDING')
      setIsRegistered(true)
      
    } catch (error: any) {
      console.error('Registration failed:', error)
      const errorMsg = error.response?.data?.error || "Registration failed. Please try again."
      
      // If already pending, just show pending screen
      if (errorMsg.includes('already pending')) {
          setStatus('PENDING');
          setIsRegistered(true);
      } else {
          alert(errorMsg); // Simple fallback
      }
    } finally {
        setIsSubmitting(false)
    }
  }

  if (status === 'PENDING') {
    return (
      <Card className="w-full max-w-md mx-auto border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">Application Under Review</h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            Your identity verification is pending admin approval. You will receive access once verified.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-teal-100 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-2xl text-teal-700 dark:text-teal-400">Identity Registration</CardTitle>
        <CardDescription>
          Complete verification to access advanced features. Your PII is hashed on-chain for privacy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!address ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Wallet Not Connected</AlertTitle>
            <AlertDescription>Please connect your wallet to proceed with registration.</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Legal / Company Name</Label>
              <Input {...form.register("fullName")} placeholder="Pharma Corp Inc." />
              {form.formState.errors.fullName && <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax / License ID</Label>
                <Input {...form.register("taxId")} placeholder="MFG-12345" />
                {form.formState.errors.taxId && <p className="text-sm text-red-500">{form.formState.errors.taxId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input {...form.register("phone")} placeholder="+1 234 567 8900" />
                {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input {...form.register("email")} type="email" placeholder="compliance@pharma.com" />
              {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Input {...form.register("address")} placeholder="123 Science Park Drive, City" />
              {form.formState.errors.address && <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hashing & Registering...
                </>
              ) : (
                "Submit Identity Verification"
              )}
            </Button>
            
            <p className="text-xs text-slate-400 text-center mt-4">
              By submitting, you agree to store your hash on the PharmaChain public ledger.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
