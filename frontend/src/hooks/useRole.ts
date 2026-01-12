import { useReadContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESS } from '../config/constants'
import PharmaChainV2ABI from '../config/PharmaChainV2.json'
import { useMemo } from 'react'

export function useRole() {
  const { address } = useAccount()

  // Get MANUFACTURER_ROLE hash
  const { data: manufacturerRole } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PharmaChainV2ABI.abi,
    functionName: 'MANUFACTURER_ROLE',
  })

  // Check if user has manufacturer role
  const { data: isManufacturer } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PharmaChainV2ABI.abi,
    functionName: 'hasRole',
    args: [manufacturerRole, address],
    query: {
      enabled: !!address && !!manufacturerRole,
    },
  })

  // Get DISTRIBUTOR_ROLE hash
  const { data: distributorRole } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PharmaChainV2ABI.abi,
    functionName: 'DISTRIBUTOR_ROLE',
  })

  // Check if user has distributor role
  const { data: isDistributor } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PharmaChainV2ABI.abi,
    functionName: 'hasRole',
    args: [distributorRole, address],
    query: {
      enabled: !!address && !!distributorRole,
    },
  })

  return useMemo(() => ({
    isManufacturer: !!isManufacturer,
    isDistributor: !!isDistributor,
    hasAnyRole: !!isManufacturer || !!isDistributor,
  }), [isManufacturer, isDistributor])
}
