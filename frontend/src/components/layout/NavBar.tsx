import { Link, useLocation } from 'react-router-dom'
import { Package, Search, Home, Map, Bell, Sparkles } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { CustomConnectButton } from './CustomConnectButton'
import { API_URL } from '../../config/constants'

const ADMIN_WALLET = "0xdB77AA93eB6969F487234E042bb5A1C9deDbd5BB";

export function NavBar() {
  const { address, isConnected } = useAccount()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userStatus, setUserStatus] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const location = useLocation()

  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase() || userRole === 'ADMIN'

  const lastFetchedAddress = useRef<string | null>(null);

  const fetchUserStatus = useCallback(async () => {
      // Prevent fetching if already fetched for this address
      if (!address || (lastFetchedAddress.current === address && userStatus)) {
          return;
      }
      
      const currentAddress = address; // capture for comparison

      // If Admin, fetch pending requests count
      if (isAdmin) {
          try {
              const res = await axios.get(`${API_URL}/admin/pending-users`, {
                  headers: { 'x-wallet-address': address }
              });
              setPendingCount(res.data.length);
              lastFetchedAddress.current = currentAddress;
          } catch (e) {
              console.error("Failed to fetch pending users", e);
          }
          return;
      }

      // Fetch user status from backend
      try {
        const res = await axios.get(`${API_URL}/users/${address}`);
        setUserStatus(res.data.status);
        setUserRole(res.data.role);
        lastFetchedAddress.current = currentAddress;
      } catch (e: any) {
        // Only log if not a 404 (user not found is expected for new users)
        if (e.response && e.response.status !== 404) {
             console.error("Error fetching user status", e);
        }
        setUserStatus(null);
        // We still mark as fetched to avoid loop on 404/error
        lastFetchedAddress.current = currentAddress; 
      }
    }, [address, isAdmin, userStatus]);

  useEffect(() => {
    if (isConnected && address) {
        // Reset cache if address changes (handled by the ref check logic mostly, but good to be explicit if needed)
        if (lastFetchedAddress.current !== address) {
             fetchUserStatus();
        }
    } else {
        lastFetchedAddress.current = null;
        setUserStatus(null);
        setUserRole(null);
    }
  }, [fetchUserStatus, isConnected, address]);

  // Helper function to check if link is active
  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-slate-900/50">
      {/* Gradient overlay for premium effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-teal-500/5 pointer-events-none" />
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="flex h-20 items-center gap-8">
          {/* Logo & Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group flex-shrink-0"
          >
            <div className="relative">
              {/* Glow effect on logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-gradient-to-br from-teal-600 to-cyan-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-teal-500/50 transition-all duration-300 group-hover:scale-110">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                PharmaChain
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Blockchain Verified
              </span>
            </div>
          </Link>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {/* Home Link */}
            <Link to="/">
              <button
                className={`
                  group relative px-4 py-2.5 rounded-full font-medium text-sm
                  transition-all duration-300 overflow-hidden
                  ${isActive('/') 
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' 
                    : 'text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                  }
                `}
              >
                {!isActive('/') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                <span className="relative flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </span>
              </button>
            </Link>

            {/* Traceability Link (Updated from Search) */}
            <Link to="/traceability">
              <button
                className={`
                  group relative px-4 py-2.5 rounded-full font-medium text-sm
                  transition-all duration-300 overflow-hidden
                  ${isActive('/traceability') 
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' 
                    : 'text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                  }
                `}
              >
                {!isActive('/traceability') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                <span className="relative flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Traceability
                </span>
              </button>
            </Link>

            {/* Admin Links */}
            {isAdmin && (
              <>
                <Link to="/traceability">
                  <button
                    className={`
                      group relative px-4 py-2.5 rounded-full font-medium text-sm
                      transition-all duration-300 overflow-hidden
                      ${isActive('/traceability') 
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' 
                        : 'text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                      }
                    `}
                  >
                    {!isActive('/traceability') && (
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    <span className="relative flex items-center gap-2">
                      <Map className="w-4 h-4" />
                      Traceability
                    </span>
                  </button>
                </Link>




              </>
            )}
          </div>

          {/* Right Side: Status & Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Register Button - Glossy Premium Style */}
            {(!isConnected || (isConnected && !isAdmin && !userStatus)) && (
              <Link to="/register">
                <button className="group relative px-6 py-2.5 rounded-full font-semibold text-sm overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-teal-500/50">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 transition-transform duration-300 group-hover:scale-110" />
                  {/* Glossy overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                  {/* Shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  </div>
                  <span className="relative text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Register Now
                  </span>
                </button>
              </Link>
            )}

            {/* Status Badges - Premium Style */}
            {isConnected && !isAdmin && (
              <>
                {userStatus === 'PENDING' && (
                  <div className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 backdrop-blur-sm">
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      Pending Approval
                    </span>
                  </div>
                )}
                
                {userStatus === 'APPROVED' && userRole && (
                  <Link to="/dashboard">
                    <div className="group px-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-teal-500/50 hover:scale-105">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        {userRole}
                      </span>
                    </div>
                  </Link>
                )}
              </>
            )}

            {/* Admin Badge - Premium Style */}
            {isAdmin && (
              <div className="flex items-center gap-3">
                  <Link to="/admin/requests">
                   <button className="relative px-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 border border-teal-500/20 shadow-lg shadow-teal-500/20 transition-all duration-300 group">
                     <span className="relative flex items-center gap-2 text-sm font-bold text-white">
                       <Bell className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                       Admin
                       {pendingCount > 0 && (
                         <span className="ml-1 px-1.5 py-0.5 min-w-[20px] h-5 bg-white text-teal-600 text-[10px] rounded-full flex items-center justify-center font-extrabold shadow-sm">
                           {pendingCount}
                         </span>
                       )}
                     </span>
                   </button>
                 </Link>
               </div>
             )}

            {/* Connect Button - Custom Shadcn UI Button */}
            <CustomConnectButton />
          </div>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
    </nav>
  )
}
