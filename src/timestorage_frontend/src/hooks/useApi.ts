'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { internalApiClient, publicApiClient } from '@/services/apiClient'
import { User } from '@/store/auth.store'

// Query keys
export const queryKeys = {
  currentUser: ['currentUser'],
  users: ['users'],
  dashboard: ['dashboard'],
} as const

// Current user hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      const response = await internalApiClient.get<User>('/users/me')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdatePrincipalId() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (principalId: string) => {
      const response = await internalApiClient.patch<User>('/users/me/principal', {
        principalId
      })
      return response.data
    },
    onSuccess: (data: User) => {
      // Update the current user query cache
      queryClient.setQueryData(queryKeys.currentUser, data)
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser })
    },
  })
}

// Users management hooks
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const response = await internalApiClient.get<User[]>('/users')
      return response.data
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: { sub: string; email: string; name: string; picture?: string }) => {
      const response = await internalApiClient.post<User>('/users', userData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; picture?: string; principalId?: string } }) => {
      const response = await internalApiClient.patch<User>(`/users/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      // Invalidate both users list and current user
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await internalApiClient.delete(`/users/${id}`)
      return id
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

// Dashboard hooks
interface DashboardData {
  message: string
  currentUser?: {
    sub: string
    email: string
    firstName: string
    lastName: string
  }
  stats: {
    totalUsers: number
    activeUsers: number
    totalOrders: number
  }
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const response = await internalApiClient.get<DashboardData>('/dashboard')
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Public API hooks (no authentication required)
export function usePublicHealth() {
  return useQuery({
    queryKey: ['publicHealth'],
    queryFn: async () => {
      const response = await publicApiClient.get('/health')
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Generic API hook for custom endpoints
export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options?: {
    enabled?: boolean
    staleTime?: number
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await internalApiClient.get<T>(endpoint)
      return response.data
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime || 1 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
  })
}

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: Error) => void
  }
) {
  return useMutation({
    mutationFn,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}