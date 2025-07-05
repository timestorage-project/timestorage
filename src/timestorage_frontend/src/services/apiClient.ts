import { authStore } from '@/store/auth.store'
import { refreshTokens } from './auth0Service'

export interface ApiClientConfig {
  baseURL?: string
  headers?: Record<string, string>
}

export interface ApiResponse<T = unknown> {
  data: T
  status: number
  statusText: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      // Try to get fresh access token from Auth0 client first
      let token = await authStore.getState().getAccessToken()

      // Fallback to stored access token
      if (!token) {
        token = authStore.getState().getAccessToken()
      }

      if (token) {
        console.log('Using access token for API call:', token.substring(0, 50) + '...')
        return {
          Authorization: `Bearer ${token}`
        }
      } else {
        console.log('No access token available')
      }
    } catch (error) {
      console.error('Error getting auth headers:', error)
    }

    return {}
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type')
    let data: T

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text() as unknown as T
    }

    if (!response.ok) {
      // If 401, try to refresh tokens
      if (response.status === 401) {
        try {
          await refreshTokens()
          // Retry the request after refreshing tokens
          // This would need to be implemented by retrying the original request
        } catch {
          // Refresh failed, user needs to login again
          authStore.getState().logout()
          window.location.href = '/login'
        }
      }

      throw new ApiError(response.status, response.statusText, data)
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText
    }
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const authHeaders = await this.getAuthHeaders()

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...options.headers
      }
    })

    return this.handleResponse<T>(response)
  }

  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    })
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    })
  }
}

// Create singleton instances for different API endpoints
export const apiClient = new ApiClient()

// Internal API client for protected endpoints
export const internalApiClient = new ApiClient({
  baseURL: `${process.env.BACKEND_URL || 'http://localhost:3030'}/api-internal`
})

// Public API client for public endpoints
export const publicApiClient = new ApiClient({
  baseURL: `${process.env.BACKEND_URL || 'http://localhost:3030'}/api`
})