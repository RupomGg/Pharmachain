import axios from 'axios'
import type { Batch, BatchesResponse, TraceabilityData, EventLog } from '../types/batch'

import { API_URL } from '../config/constants'

const API_BASE_URL = API_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Batch endpoints
export const batchApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; owner?: string }) => {
    const { data} = await api.get<BatchesResponse>('/batches', { params })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get<Batch>(`/batches/${id}`)
    return data
  },

  getByOwner: async (address: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<BatchesResponse>(`/batches/owner/${address}`, { params })
    return data
  },

  // Manufacturer Portal Endpoints
  getStats: async (address: string) => {
    const { data } = await api.get('/batches/stats', {
      headers: { 'x-wallet-address': address }
    });
    return data;
  },

  search: async (address: string, params: { q?: string; sort?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/batches/search', {
      params,
      headers: { 'x-wallet-address': address }
    });
    return data;
  },

  createManual: async (address: string, batches: any[]) => {
    const { data } = await api.post('/batches/manual', { batches }, {
      headers: { 'x-wallet-address': address }
    });
    return data;
  }
}

// Traceability endpoints
export const traceApi = {
  getFull: async (batchId: number) => {
    const { data } = await api.get<TraceabilityData>(`/trace/${batchId}`)
    return data
  },

  getUpstream: async (batchId: number) => {
    const { data } = await api.get(`/trace/${batchId}/upstream`)
    return data
  },

  getDownstream: async (batchId: number) => {
    const { data } = await api.get(`/trace/${batchId}/downstream`)
    return data
  },
}

// Event endpoints
export const eventApi = {
  getAll: async (params?: { page?: number; limit?: number; eventName?: string; batchId?: number }) => {
    const { data } = await api.get<{ events: EventLog[]; pagination: any }>('/events', { params })
    return data
  },
}

// Metadata validation
export const metadataApi = {
  validate: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post('/metadata/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },
}

export default api
