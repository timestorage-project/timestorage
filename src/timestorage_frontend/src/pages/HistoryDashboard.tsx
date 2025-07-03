import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Package, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Motion } from '@/components/ui/motion'
import Header from '@/components/Header'
import BottomNavigation from '@/components/BottomNavigation'
import { historyService, HistoryItem } from '@/services/historyService'
import { useTranslation } from '@/hooks/useTranslation'

const HistoryDashboard: FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [projects, setProjects] = useState<HistoryItem[]>([])
  const [uuids, setUuids] = useState<HistoryItem[]>([])
  const [projectPage, setProjectPage] = useState(0)
  const [uuidPage, setUuidPage] = useState(0)
  
  // Responsive items per page
  const [projectsPerPage, setProjectsPerPage] = useState(4)
  const [uuidsPerPage, setUuidsPerPage] = useState(6)

  useEffect(() => {
    // Load history from localStorage
    setProjects(historyService.getProjects())
    setUuids(historyService.getUUIDs())

    // Set responsive items per page
    const updateItemsPerPage = () => {
      const isMobile = window.innerWidth < 640
      setProjectsPerPage(isMobile ? 3 : 4)
      setUuidsPerPage(isMobile ? 6 : 8)
    }

    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [])

  const handleProjectClick = (projectUuid: string) => {
    navigate(`/project/${projectUuid}`)
  }

  const handleUuidClick = (uuid: string) => {
    navigate(`/view/${uuid}`)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 1 ? t('HISTORY_JUST_NOW') : `${diffMinutes} ${t('HISTORY_MINUTES_AGO')}`
      }
      return diffHours === 1 ? t('HISTORY_HOUR_AGO') : `${diffHours} ${t('HISTORY_HOURS_AGO')}`
    } else if (diffDays === 1) {
      return t('HISTORY_YESTERDAY')
    } else if (diffDays < 7) {
      return `${diffDays} ${t('HISTORY_DAYS_AGO')}`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Pagination calculations
  const totalProjectPages = Math.ceil(projects.length / projectsPerPage)
  const totalUuidPages = Math.ceil(uuids.length / uuidsPerPage)
  
  const paginatedProjects = projects.slice(
    projectPage * projectsPerPage,
    (projectPage + 1) * projectsPerPage
  )
  
  const paginatedUuids = uuids.slice(
    uuidPage * uuidsPerPage,
    (uuidPage + 1) * uuidsPerPage
  )

  return (
    <div className='min-h-screen bg-base-200 pb-20'>
      <Header title={t('HISTORY_TITLE')} />
      <div className='container mx-auto px-4 py-6'>
        <Motion variant='fadeIn' duration={500}>
          {/* Projects Section - Only show if there are 2 or more projects */}
          {projects.length > 1 && (
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-semibold'>{t('HISTORY_RECENT_PROJECTS')}</h2>
              {projects.length > projectsPerPage && (
                <div className='flex items-center gap-2'>
                  <button
                    className='btn btn-sm btn-circle'
                    onClick={() => setProjectPage(Math.max(0, projectPage - 1))}
                    disabled={projectPage === 0}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <span className='text-sm'>
                    {projectPage + 1} / {totalProjectPages}
                  </span>
                  <button
                    className='btn btn-sm btn-circle'
                    onClick={() => setProjectPage(Math.min(totalProjectPages - 1, projectPage + 1))}
                    disabled={projectPage === totalProjectPages - 1}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
              )}
            </div>

            {projects.length === 0 ? (
              <div className='card bg-base-100 shadow-sm'>
                <div className='card-body flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <Building2 className='mx-auto h-12 w-12 mb-4 text-base-content/50' />
                    <h4 className='text-xl'>{t('HISTORY_NO_RECENT_PROJECTS')}</h4>
                    <p className='text-sm mt-2 text-base-content/70'>
                      {t('HISTORY_PROJECTS_APPEAR_HERE')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4'>
                {paginatedProjects.map((project, index) => (
                  <Motion key={project.uuid} variant='slideUp' duration={300} delay={index * 100}>
                    <div
                      className='card bg-base-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer'
                      onClick={() => handleProjectClick(project.uuid)}
                    >
                      <div className='card-body p-6'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-3'>
                              <Building2 className='h-5 w-5 text-primary' />
                              <span className='text-sm capitalize'>{t('HISTORY_PROJECT_TYPE')}</span>
                              <span className='text-xs text-base-content/50'>
                                • {formatDate(project.timestamp)}
                              </span>
                            </div>

                            <h4 className='text-lg font-semibold mb-2'>
                              {project.identification || t('HISTORY_UNTITLED_PROJECT')}
                            </h4>

                            {project.subIdentification && (
                              <p className='text-sm mb-3'>{project.subIdentification}</p>
                            )}

                            <p className='text-xs text-base-content/70'>ID: {project.uuid}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Motion>
                ))}
              </div>
            )}
          </div>
          )}

          {/* UUIDs Section */}
          <div>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-semibold'>{t('HISTORY_RECENT_EQUIPMENT')}</h2>
              {uuids.length > uuidsPerPage && (
                <div className='flex items-center gap-2'>
                  <button
                    className='btn btn-sm btn-circle'
                    onClick={() => setUuidPage(Math.max(0, uuidPage - 1))}
                    disabled={uuidPage === 0}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <span className='text-sm'>
                    {uuidPage + 1} / {totalUuidPages}
                  </span>
                  <button
                    className='btn btn-sm btn-circle'
                    onClick={() => setUuidPage(Math.min(totalUuidPages - 1, uuidPage + 1))}
                    disabled={uuidPage === totalUuidPages - 1}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
              )}
            </div>

            {uuids.length === 0 ? (
              <div className='card bg-base-100 shadow-sm'>
                <div className='card-body flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <Package className='mx-auto h-12 w-12 mb-4 text-base-content/50' />
                    <h4 className='text-xl'>{t('HISTORY_NO_RECENT_EQUIPMENT')}</h4>
                    <p className='text-sm mt-2 text-base-content/70'>
                      {t('HISTORY_EQUIPMENT_APPEAR_HERE')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {paginatedUuids.map((uuid, index) => (
                  <Motion key={uuid.uuid} variant='slideUp' duration={300} delay={index * 50}>
                    <div
                      className='card bg-base-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer'
                      onClick={() => handleUuidClick(uuid.uuid)}
                    >
                      <div className='card-body p-4'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Package className='h-4 w-4 text-primary' />
                          <Clock className='h-3 w-3 text-base-content/50' />
                          <span className='text-xs text-base-content/50'>
                            {formatDate(uuid.timestamp)}
                          </span>
                        </div>

                        <h4 className='text-base font-semibold mb-1'>
                          {uuid.identification || t('HISTORY_EQUIPMENT_DEFAULT')}
                        </h4>

                        {uuid.subIdentification && (
                          <p className='text-sm text-base-content/70 mb-2'>{uuid.subIdentification}</p>
                        )}

                        <p className='text-xs text-base-content/60 truncate'>ID: {uuid.uuid}</p>
                      </div>
                    </div>
                  </Motion>
                ))}
              </div>
            )}
          </div>

          {/* Clear History Button */}
          {(projects.length > 0 || uuids.length > 0) && (
            <div className='mt-8 text-center'>
              <button
                className='btn btn-sm btn-ghost'
                onClick={() => {
                  if (window.confirm(t('HISTORY_CLEAR_CONFIRM'))) {
                    historyService.clearHistory()
                    setProjects([])
                    setUuids([])
                  }
                }}
              >
                {t('HISTORY_CLEAR_HISTORY')}
              </button>
            </div>
          )}
        </Motion>
      </div>
      <BottomNavigation />
    </div>
  )
}

export default HistoryDashboard