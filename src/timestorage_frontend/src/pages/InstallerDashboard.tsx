import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Package,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Motion } from '@/components/ui/motion'
import Header from '@/components/Header'
import BottomNavigation from '@/components/BottomNavigation'
import { useProjectsInstaller, InstallerProject } from '@/hooks/useProjectsInstaller'
import { useAuthStore } from '@/store/auth.store'

const InstallerDashboard: FC = () => {
  const navigate = useNavigate()
  const { user ,isInstaller} = useAuthStore()
  const [currentPage, setCurrentPage] = useState(0)
  const [invitationsPage, setInvitationsPage] = useState(0)

  // Responsive items per page
  const [projectsPerPage, setProjectsPerPage] = useState(4)
  const [invitationsPerPage, setInvitationsPerPage] = useState(4)

  const { currentProjects, invitations, completedProjects, loading, error, updateProjectStatus, refresh } =
    useProjectsInstaller()

  useEffect(() => {
    // Redirect if user is not an installer
    if (user && !isInstaller) {
      navigate('/dashboard')
      return
    }

    // Set responsive items per page
    const updateItemsPerPage = () => {
      const isMobile = window.innerWidth < 640
      setProjectsPerPage(isMobile ? 2 : 4)
      setInvitationsPerPage(isMobile ? 2 : 4)
    }

    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [user, navigate, isInstaller])

  const handleProjectClick = (project: InstallerProject) => {
    navigate(`/installer-project/${project.id}`)
  }

  const handleAcceptInvitation = async (id: string) => {
    try {
      await updateProjectStatus(id, 'accepted')
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      // TODO: Show error toast
    }
  }

  const handleRejectInvitation = async (id: string) => {
    try {
      await updateProjectStatus(id, 'rejected')
    } catch (error) {
      console.error('Failed to reject invitation:', error)
      // TODO: Show error toast
    }
  }

  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'rejected':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'pending':
        return <AlertCircle className='h-4 w-4 text-yellow-500' />
      default:
        return <Clock className='h-4 w-4 text-gray-500' />
    }
  }

  // Get recent projects (last 30 days) - deduplicate by id
  const recentProjects = [...currentProjects, ...completedProjects]
    .filter((project, index, array) => {
      // Remove duplicates by id
      return array.findIndex(p => p.id === project.id) === index
    })
    .filter(project => {
      const projectDate = new Date(project.updatedAt)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return projectDate >= thirtyDaysAgo
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  // Pagination calculations
  const totalCurrentPages = Math.ceil(recentProjects.length / projectsPerPage)
  const totalInvitationPages = Math.ceil(invitations.length / invitationsPerPage)

  const paginatedCurrentProjects = recentProjects.slice(
    currentPage * projectsPerPage,
    (currentPage + 1) * projectsPerPage
  )

  const paginatedInvitations = invitations.slice(
    invitationsPage * invitationsPerPage,
    (invitationsPage + 1) * invitationsPerPage
  )

  if (loading) {
    return (
      <div className='min-h-screen bg-base-200 pb-20'>
        <Header title='Installer Dashboard' />
        <div className='container mx-auto px-4 py-6'>
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='loading loading-spinner loading-lg mb-4'></div>
              <p>Loading your projects...</p>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-base-200 pb-20'>
        <Header title='Installer Dashboard' />
        <div className='container mx-auto px-4 py-6'>
          <div className='card bg-base-100 shadow-sm'>
            <div className='card-body flex items-center justify-center py-12'>
              <div className='text-center'>
                <XCircle className='mx-auto h-12 w-12 mb-4 text-red-500' />
                <h4 className='text-xl mb-2'>Error Loading Projects</h4>
                <p className='text-sm text-base-content/70 mb-4'>{error}</p>
                <button className='btn btn-primary' onClick={refresh}>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-base-200 pb-20'>
      <Header title='Installer Dashboard' />
      <div className='container mx-auto px-4 py-6'>
        <Motion variant='fadeIn' duration={500}>
          {/* Project Invitations Section */}
          {invitations.length > 0 && (
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-2xl font-semibold'>Project Invitations</h2>
                {invitations.length > invitationsPerPage && (
                  <div className='flex items-center gap-2'>
                    <button
                      className='btn btn-sm btn-circle'
                      onClick={() => setInvitationsPage(Math.max(0, invitationsPage - 1))}
                      disabled={invitationsPage === 0}
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </button>
                    <span className='text-sm'>
                      {invitationsPage + 1} / {totalInvitationPages}
                    </span>
                    <button
                      className='btn btn-sm btn-circle'
                      onClick={() => setInvitationsPage(Math.min(totalInvitationPages - 1, invitationsPage + 1))}
                      disabled={invitationsPage === totalInvitationPages - 1}
                    >
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4'>
                {paginatedInvitations.map((invitation, index) => (
                  <Motion key={invitation.id} variant='slideUp' duration={300} delay={index * 100}>
                    <div className='card bg-base-100 shadow-sm hover:shadow-lg transition-all duration-200'>
                      <div className='card-body p-6'>
                        <div className='flex items-start justify-between mb-4'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-3'>
                              <Building2 className='h-5 w-5 text-primary' />
                              <span className='text-sm font-medium'>New Project Invitation</span>
                              <span className='text-xs text-base-content/50'>
                                • {formatDate(invitation.invitationDate || invitation.createdAt)}
                              </span>
                            </div>

                            <h4 className='text-lg font-semibold mb-2'>
                              {invitation.project?.projectNumber || 'Project'}
                            </h4>

                            {invitation.project?.businessName && (
                              <p className='text-sm mb-2 flex items-center gap-1'>
                                <User className='h-3 w-3' />
                                {invitation.project.businessName}
                              </p>
                            )}

                            {invitation.project?.city && (
                              <p className='text-sm mb-2 flex items-center gap-1'>
                                <MapPin className='h-3 w-3' />
                                {invitation.project.city}
                              </p>
                            )}

                            <p className='text-xs text-base-content/70'>ID: {invitation.id}</p>
                          </div>
                        </div>

                        <div className='flex gap-2'>
                          <button
                            className='btn btn-success btn-sm flex-1'
                            onClick={() => handleAcceptInvitation(invitation.id)}
                          >
                            Accept
                          </button>
                          <button
                            className='btn btn-error btn-sm flex-1'
                            onClick={() => handleRejectInvitation(invitation.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </Motion>
                ))}
              </div>
            </div>
          )}

          {/* Recent Projects Section */}
          <div>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-semibold'>Recent Projects (Last 30 Days)</h2>
              {recentProjects.length > projectsPerPage && (
                <div className='flex items-center gap-2'>
                  <button
                    className='btn btn-sm btn-circle'
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <span className='text-sm'>
                    {currentPage + 1} / {totalCurrentPages}
                  </span>
                  <button
                    className='btn btn-sm btn-circle'
                    onClick={() => setCurrentPage(Math.min(totalCurrentPages - 1, currentPage + 1))}
                    disabled={currentPage === totalCurrentPages - 1}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
              )}
            </div>

            {recentProjects.length === 0 ? (
              <div className='card bg-base-100 shadow-sm'>
                <div className='card-body flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <Package className='mx-auto h-12 w-12 mb-4 text-base-content/50' />
                    <h4 className='text-xl'>No Recent Projects</h4>
                    <p className='text-sm mt-2 text-base-content/70'>
                      Your recent projects will appear here once you start working on them.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4'>
                {paginatedCurrentProjects.map((project, index) => (
                  <Motion key={project.id} variant='slideUp' duration={300} delay={index * 100}>
                    <div
                      className='card bg-base-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer'
                      onClick={() => handleProjectClick(project)}
                    >
                      <div className='card-body p-6'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-3'>
                              <Building2 className='h-5 w-5 text-primary' />
                              <span className='text-sm capitalize'>{project.status}</span>
                              {getStatusIcon(project.status)}
                              <span className='text-xs text-base-content/50'>• {formatDate(project.updatedAt)}</span>
                            </div>

                            <h4 className='text-lg font-semibold mb-2'>
                              {project.project?.projectNumber || 'Project'}
                            </h4>

                            {project.project?.businessName && (
                              <p className='text-sm mb-2 flex items-center gap-1'>
                                <User className='h-3 w-3' />
                                {project.project.businessName}
                              </p>
                            )}

                            {project.project?.city && (
                              <p className='text-sm mb-2 flex items-center gap-1'>
                                <MapPin className='h-3 w-3' />
                                {project.project.city}
                              </p>
                            )}

                            <p className='text-xs text-base-content/70'>ID: {project.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Motion>
                ))}
              </div>
            )}
          </div>
        </Motion>
      </div>
      <BottomNavigation />
    </div>
  )
}

export default InstallerDashboard
