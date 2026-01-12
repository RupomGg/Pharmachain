import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string | undefined): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    CREATED: 'bg-green-500',
    IN_TRANSIT: 'bg-amber-500',
    DELIVERED: 'bg-blue-500',
    RECALLED: 'bg-red-500',
  }
  return colors[status] || 'bg-gray-500'
}

export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    CREATED: 'default',
    IN_TRANSIT: 'secondary',
    DELIVERED: 'outline',
    RECALLED: 'destructive',
  }
  return variants[status] || 'default'
}
