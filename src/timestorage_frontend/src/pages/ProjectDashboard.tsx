import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, Package } from 'lucide-react'
// Using DaisyUI classes directly instead of custom components
import { Typography } from '@/components/ui/typography'
import { Motion } from '@/components/ui/motion'
import Header from '@/components/Header'
import ErrorView from '@/components/ErrorView'
import LoadingView from '@/components/LoadingView'
import BottomNavigation from '@/components/BottomNavigation'
import * as canisterService from '@/services/canisterService'

// Use the transformed project type from canisterService
type TransformedProjectAPIResponse = Awaited<ReturnType<typeof canisterService.getProject>>

interface EquipmentCard {
  uuid: string
  identification: string
  subIdentification: string
  type: 'placement' | 'linkedStructure'
}

const ProjectDashboard: FC = () => {
  const navigate = useNavigate()
  const { projectId, uuid } = useParams<{ projectId?: string; uuid?: string }>()
  const [project, setProject] = useState<TransformedProjectAPIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [equipmentCards, setEquipmentCards] = useState<EquipmentCard[]>([])

  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        let projectData: TransformedProjectAPIResponse | null = null

        if (projectId) {
          // Route 1: Load by project ID
          projectData = await canisterService.getProjectByUuid(projectId)
        } else if (uuid) {
          // Route 2: Load by equipment UUID - first get the equipment data, then find its project
          projectData = await canisterService.getProjectByUuid(uuid)
        } else {
          setError('No project ID or equipment UUID provided')
          return
        }

        if (!projectData) {
          setError('Project not found')
          return
        }

        setProject(projectData)

        // Process equipment cards from placements and linkedStructures
        const cards: EquipmentCard[] = []

        // Add placements
        // projectData.placements.forEach(placement => {
        //   const info = placement.info[0] // Optional array, take first element if exists
        //   if (info) {
        //     cards.push({
        //       uuid: placement.uuid,
        //       identification: info.identification[0] || 'Unknown',
        //       subIdentification: info.subIdentification[0] || '',
        //       type: 'placement'
        //     })
        //   }
        // })

        // Add linked structures
        projectData.linkedStructures.forEach(structure => {
          const info = structure.info // Now it's a single object or undefined
          if (info) {
            cards.push({
              uuid: structure.uuid,
              identification: info.identification || 'Unknown',
              subIdentification: info.subIdentification || '',
              type: 'linkedStructure'
            })
          }
        })

        setEquipmentCards(cards)
      } catch (err) {
        console.error('Error loading project data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load project data')
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectData()
  }, [projectId, uuid])

  const handleEquipmentClick = (equipmentUuid: string) => {
    navigate(`/view/${equipmentUuid}`)
  }

  if (isLoading) {
    return <LoadingView message='Loading project dashboard...' />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  if (!project) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Typography variant='h4'>No project data found</Typography>
      </div>
    )
  }

  const projectInfo = project.info
  const projectTitle = projectInfo.identification || 'Untitled Project'
  const projectSubtitle = projectInfo.subIdentification || ''

  return (
    <div className='min-h-screen bg-base-200 pb-20'>
      <Header title='Project Dashboard' />
      <div className='container mx-auto px-4 py-6'>
        <Motion variant='fadeIn' duration={500}>
          {/* Project Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold mb-2'>{projectTitle}</h1>
            {projectSubtitle && <h3 className='text-xl'>{projectSubtitle}</h3>}
          </div>

          <div className='mb-6'>
            <h2 className='text-2xl font-semibold mb-4'>Elementi ({equipmentCards.length})</h2>

            {equipmentCards.length === 0 ? (
              <div className='card bg-base-100 shadow-sm'>
                <div className='card-body flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <Package className='mx-auto h-12 w-12 mb-4' />
                    <h4 className='text-xl'>No equipment found</h4>
                    <p className='text-sm mt-2'>This project doesn't have any equipment assigned yet.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {equipmentCards.map((equipment, index) => (
                  <Motion key={equipment.uuid} variant='slideUp' duration={300} delay={index * 100}>
                    <div
                      className='card bg-base-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer'
                      onClick={() => handleEquipmentClick(equipment.uuid)}
                    >
                      <div className='card-body p-6'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-3'>
                              {equipment.type === 'placement' ? (
                                <Building2 className='h-5 w-5 text-primary' />
                              ) : (
                                <Package className='h-5 w-5 text-primary' />
                              )}
                              <span className='text-sm capitalize'>
                                {equipment.type === 'placement' ? 'Placement' : 'Linked Structure'}
                              </span>
                            </div>

                            <h4 className='text-lg font-semibold mb-2'>{equipment.identification}</h4>

                            {equipment.subIdentification && (
                              <p className='text-sm mb-3'>{equipment.subIdentification}</p>
                            )}

                            <p className='text-xs'>Matricola: {equipment.uuid}</p>
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

export default ProjectDashboard
