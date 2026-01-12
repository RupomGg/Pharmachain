import { useQuery } from '@tanstack/react-query'
import { batchApi } from '../lib/api'

export function useBatches(params?: { page?: number; limit?: number; status?: string; owner?: string }) {
  return useQuery({
    queryKey: ['batches', params],
    queryFn: () => batchApi.getAll(params),
    staleTime: 5000,
  })
}

export function useBatch(id: number | undefined) {
  return useQuery({
    queryKey: ['batch', id],
    queryFn: () => batchApi.getById(id!),
    enabled: !!id,
    staleTime: 5000,
  })
}

export function useOwnerBatches(address: string | undefined, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['batches', 'owner', address, params],
    queryFn: () => batchApi.getByOwner(address!, params),
    enabled: !!address,
    staleTime: 5000,
  })
}
