import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import axios from 'axios'

const ADMIN_WALLET = "0xdB77AA93eB6969F487234E042bb5A1C9deDbd5BB"
import { API_URL } from '../config/constants'

export function Dashboard() {
  const { address } = useAccount()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const redirectToDashboard = async () => {
      if (!address) {
        // Not connected, redirect to home
        navigate('/')
        return
      }

      // Check if admin
      if (address.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
        navigate('/admin/requests')
        return
      }

      // Fetch user role from backend
      try {
        const res = await axios.get(`${API_URL}/users/${address}`)
        const { role, status } = res.data

        // Check if role is ADMIN (Backend source of truth)
        if (role === 'ADMIN') {
          navigate('/admin/requests')
          return
        }

        if (status !== 'APPROVED') {
          // User not approved yet, redirect to home
          navigate('/')
          return
        }

        // Redirect based on role
        switch (role) {
          case 'MANUFACTURER':
            navigate('/manufacturer')
            break
          case 'DISTRIBUTOR':
          case 'PHARMACY':
            navigate('/distributor')
            break
          default:
            navigate('/')
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error)
        // User not found, redirect to register
        navigate('/register')
      } finally {
        setLoading(false)
      }
    }

    redirectToDashboard()
  }, [address, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return null
}
