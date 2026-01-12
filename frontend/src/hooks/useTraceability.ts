import { useQuery } from '@tanstack/react-query'
import { traceApi } from '../lib/api'

export function useTraceability(batchId: number | undefined) {
  return useQuery({
    queryKey: ['traceability', batchId],
    queryFn: () => traceApi.getFull(batchId!),
    enabled: !!batchId,
    staleTime: 10000,
  })
}

export function useUpstreamTrace(batchId: number | undefined) {
  return useQuery({
    queryKey: ['traceability', 'upstream', batchId],
    queryFn: () => traceApi.getUpstream(batchId!),
    enabled: !!batchId,
    staleTime: 10000,
  })
}

export function useDownstreamTrace(batchId: number | undefined) {
  return useQuery({
    queryKey: ['traceability', 'downstream', batchId],
    queryFn: () => traceApi.getDownstream(batchId!),
    enabled: !!batchId,
    staleTime: 10000,
  })
}
