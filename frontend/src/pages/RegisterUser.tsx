import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useNavigate } from 'react-router-dom'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Loader2, CheckCircle2, AlertTriangle, Factory, Truck, Building2 } from 'lucide-react'

// Zod validation schema
const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  physicalAddress: z.string().min(10, "Address must be at least 10 characters"),
  licenseNumber: z.string().min(5, "License number must be at least 5 characters"),
})

type FormData = z.infer<typeof registrationSchema>

const ROLES = [
  {
    value: 'MANUFACTURER',
    label: 'Manufacturer',
    icon: Factory,
    description: 'Produce pharmaceutical products'
  },
  {
    value: 'DISTRIBUTOR',
    label: 'Distributor',
    icon: Truck,
    description: 'Distribute products to pharmacies'
  },
  {
    value: 'PHARMACY',
    label: 'Pharmacy',
    icon: Building2,
    description: 'Dispense products to patients'
  }
]

export default function RegisterUser() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const form = useForm<FormData>({
    resolver: zodResolver(registrationSchema),
  })

  // Check if user is already registered
  useEffect(() => {
    const checkStatus = async () => {
      if (!address) return
      try {
        const res = await axios.get(`http://localhost:3000/api/users/${address}`)
        if (res.data) {
          if (res.data.status === 'PENDING') {
            navigate('/')
          } else if (res.data.status === 'APPROVED') {
            navigate('/dashboard')
          }
        }
      } catch (e) {
        // User not found, continue with registration
      }
    }
    checkStatus()
  }, [address, navigate])

  const onSubmit = async (data: FormData) => {
    if (!address) {
      setErrorMessage('Please connect your wallet first')
      return
    }

    if (!selectedRole) {
      setErrorMessage('Please select a role')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await axios.post('http://localhost:3000/api/users/register', {
        walletAddress: address,
        name: data.name,
        email: data.email,
        phone: data.phone,
        physicalAddress: data.physicalAddress,
        licenseNumber: data.licenseNumber,
        requestedRole: selectedRole
      })

      console.log('Registration successful:', response.data)
      setShowSuccessModal(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/')
      }, 3000)

    } catch (error: any) {
      console.error('Registration failed:', error)
      const errorMsg = error.response?.data?.error || "Registration failed. Please try again."
      setErrorMessage(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-3xl mx-auto border-t-4 border-t-teal-600 shadow-xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-slate-900">
            Join PharmaChain Network
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Register your organization to participate in the pharmaceutical supply chain
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Step 1: Wallet Connection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Connect Wallet</h3>
            </div>

            {!isConnected ? (
              <div className="bg-slate-50 p-6 rounded-lg border-2 border-dashed border-slate-300 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Please connect your wallet to continue</p>
                <ConnectButton />
              </div>
            ) : (
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <Label className="text-sm text-slate-600">Connected Wallet</Label>
                <Input 
                  value={address} 
                  disabled 
                  className="mt-2 font-mono text-sm bg-white"
                />
              </div>
            )}
          </div>

          {/* Step 2: Role Selection */}
          {isConnected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold">Select Your Role</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ROLES.map((role) => {
                  const Icon = role.icon
                  const isSelected = selectedRole === role.value
                  
                  return (
                    <Card
                      key={role.value}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isSelected 
                          ? 'border-2 border-teal-600 bg-teal-50' 
                          : 'border-2 border-slate-200 hover:border-teal-300'
                      }`}
                      onClick={() => setSelectedRole(role.value)}
                    >
                      <CardContent className="p-6 text-center">
                        <Icon className={`w-12 h-12 mx-auto mb-3 ${
                          isSelected ? 'text-teal-600' : 'text-slate-400'
                        }`} />
                        <h4 className="font-semibold text-slate-900 mb-2">{role.label}</h4>
                        <p className="text-sm text-slate-600">{role.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: PII Form */}
          {isConnected && selectedRole && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold">Organization Details</h3>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Legal / Company Name *</Label>
                    <Input 
                      {...form.register("name")} 
                      placeholder="Pharma Corp Inc."
                      className="border-slate-300"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Official Email *</Label>
                    <Input 
                      {...form.register("email")} 
                      type="email"
                      placeholder="compliance@pharma.com"
                      className="border-slate-300"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      {...form.register("phone")} 
                      placeholder="+1 234 567 8900"
                      className="border-slate-300"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input 
                      {...form.register("licenseNumber")} 
                      placeholder="MFG-12345"
                      className="border-slate-300"
                    />
                    {form.formState.errors.licenseNumber && (
                      <p className="text-sm text-red-500">{form.formState.errors.licenseNumber.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physicalAddress">Physical Address *</Label>
                  <Input 
                    {...form.register("physicalAddress")} 
                    placeholder="123 Science Park Drive, City, State, ZIP"
                    className="border-slate-300"
                  />
                  {form.formState.errors.physicalAddress && (
                    <p className="text-sm text-red-500">{form.formState.errors.physicalAddress.message}</p>
                  )}
                </div>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  By submitting, you agree to store your identity hash on the PharmaChain blockchain.
                  Your personal information is securely stored off-chain.
                </p>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="w-16 h-16 text-teal-600" />
            </div>
            <DialogTitle className="text-center text-2xl">Registration Submitted!</DialogTitle>
            <DialogDescription className="text-center text-base pt-4">
              Your application has been submitted successfully. 
              <br /><br />
              <strong>Please wait for admin approval.</strong>
              <br /><br />
              You will be redirected to the home page...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
