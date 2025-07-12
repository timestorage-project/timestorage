import { useState, useEffect, useCallback } from 'react'
import { internalApiClient } from '@/services/apiClient'

export interface InstallerProject {
  id: string
  tenantId: string
  projectId: string
  installerId: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  invitationDate: Date | null
  acceptanceDate: Date | null
  rejectionDate: Date | null
  createdById: string | null
  updatedById: string | null
  createdAt: Date
  updatedAt: Date
  project?: {
    id: string
    projectNumber: string
    projectDate: Date
    customerFirstName?: string
    customerLastName?: string
    businessName?: string
    city?: string
    address?: string
    zip?: string
    province?: string;
    state?: string
    buildingType?: string
    status: string
  }
  installer?: {
    id: string
    firstName: string
    lastName: string
    email: string
    businessName?: string
  }
}

export interface GetInstallerProjectsQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  status?: string
  projectStatus?: string
  search?: string
}

export interface GetInstallerProjectsResponse {
  data: InstallerProject[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UseProjectsInstallerResult {
  projects: InstallerProject[]
  invitations: InstallerProject[]
  currentProjects: InstallerProject[]
  completedProjects: InstallerProject[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateProjectStatus: (id: string, status: 'accepted' | 'rejected') => Promise<void>
  getProject: (id: string) => Promise<InstallerProject | null>
}

export function useProjectsInstaller(): UseProjectsInstallerResult {
  const [projects, setProjects] = useState<InstallerProject[]>([])
  const [invitations, setInvitations] = useState<InstallerProject[]>([])
  const [currentProjects, setCurrentProjects] = useState<InstallerProject[]>([])
  const [completedProjects, setCompletedProjects] = useState<InstallerProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {



      // Fetch all project types in parallel
      const [projectsRes, invitationsRes, currentRes, completedRes] = await Promise.all([
        internalApiClient.get<GetInstallerProjectsResponse>(`/installer-projects/my-projects`),
        internalApiClient.get<GetInstallerProjectsResponse>(`/installer-projects/my-invitations`),
        internalApiClient.get<GetInstallerProjectsResponse>(`/installer-projects/my-current-projects`),
        internalApiClient.get<GetInstallerProjectsResponse>(`/installer-projects/my-completed-projects`)
      ])

      setProjects(projectsRes.data.data)
      setInvitations(invitationsRes.data.data)
      setCurrentProjects(currentRes.data.data)
      setCompletedProjects(completedRes.data.data)
    } catch (err) {
      console.error('Error fetching installer projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProjectStatus = useCallback(async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await internalApiClient.patch(`/installer-projects/${id}/status`, { status })
      // Refresh data after update
      await fetchProjects()
    } catch (err) {
      console.error('Error updating project status:', err)
      throw err
    }
  }, [fetchProjects])

  const getProject = useCallback(async (id: string): Promise<InstallerProject | null> => {
    try {
      const response = await internalApiClient.get<InstallerProject>(`/installer-projects/${id}`)
      return response.data
    } catch (err) {
      console.error('Error fetching project:', err)
      return null
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    invitations,
    currentProjects,
    completedProjects,
    loading,
    error,
    refresh,
    updateProjectStatus,
    getProject
  }
}