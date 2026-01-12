import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { config } from './config/wagmi'
import { NavBar } from './components/layout/NavBar'
import { Footer } from './components/layout/Footer'
import { Home } from './pages/Home'
import { Landing } from './pages/Landing'
import { ProductSearch } from './pages/ProductSearch'
import { ProductDetails } from './pages/ProductDetails'
import { Dashboard } from './pages/Dashboard'
import { ManufacturerDashboard } from './pages/ManufacturerDashboard'
import { ManufacturerInventory } from './pages/ManufacturerInventory'
import { ProductionHub } from './pages/ProductionHub'
import { DistributorDashboard } from './pages/DistributorDashboard'
import { DistributorInventory } from './pages/DistributorInventory'
import MarketplacePage from './pages/MarketplacePage'
import IncomingOrders from './pages/IncomingOrders'
import { TraceabilityPage } from './pages/TraceabilityPage'
import { InventoryPage } from './pages/InventoryPage'
import { GuestSearch } from './components/guest/GuestSearch' // New
import RegisterUser from './pages/RegisterUser' // New Registration Flow
import AdminRequests from './pages/AdminRequests'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Toaster } from './components/ui/toaster' // Add Toaster


import '@rainbow-me/rainbowkit/styles.css'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Custom RainbowKit theme matching our design
const customTheme = lightTheme({
  accentColor: '#0d9488', // teal-600
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
})

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen font-sans antialiased text-slate-900 dark:text-slate-50">
              <NavBar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<GuestSearch />} />
                  <Route path="/product-search" element={<ProductSearch />} />
                  <Route path="/legacy-landing" element={<Landing />} />
                  <Route path="/register" element={<RegisterUser />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  
                  {/* Manufacturer Portal Routes */}
                  <Route element={<ProtectedRoute requiredRole="MANUFACTURER" />}>
                     <Route path="/manufacturer" element={<ManufacturerDashboard />} /> 
                     {/* Alias for dashboard to keep backward compatibility or cleaner root */}
                     <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
                     <Route path="/manufacturer/inventory" element={<ManufacturerInventory />} />
                     <Route path="/manufacturer/create" element={<ProductionHub />} />
                     <Route path="/manufacturer/orders" element={<IncomingOrders />} />
                  </Route>

                  <Route path="/distributor" element={<DistributorDashboard />} />
                  <Route path="/distributor/inventory" element={<DistributorInventory />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/traceability" element={<TraceabilityPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                     <Route path="/admin/requests" element={<AdminRequests />} />
                  </Route>
                </Routes>
              </main>
              <Footer />
              <Toaster />
            </div>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
