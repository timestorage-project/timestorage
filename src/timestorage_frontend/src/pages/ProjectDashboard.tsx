import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, Package, ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Grid } from '@/components/ui/grid'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className='min-h-screen bg-background pb-20'>
      <Header title='Project Dashboard' />
      <Container className='py-6'>
        <Motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Project Header */}
          <div className='mb-8'>
            <Typography variant='h1' className='mb-2'>
              {projectTitle}
            </Typography>
            {projectSubtitle && (
              <Typography variant='h3' className='text-muted-foreground'>
                {projectSubtitle}
              </Typography>
            )}
            <div className='mt-4 flex items-center gap-4 text-sm text-muted-foreground'>
              <span>Project ID: {project.uuid}</span>
              {projectInfo.category && <span>Category: {projectInfo.category}</span>}
            </div>
          </div>

          {/* Equipment Cards */}
          <div className='mb-6'>
            <Typography variant='h2' className='mb-4'>
              Equipment ({equipmentCards.length})
            </Typography>

            {equipmentCards.length === 0 ? (
              <Card>
                <CardContent className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <Package className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
                    <Typography variant='h4' className='text-muted-foreground'>
                      No equipment found
                    </Typography>
                    <Typography variant='body2' className='text-muted-foreground mt-2'>
                      This project doesn't have any equipment assigned yet.
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Grid className='grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {equipmentCards.map((equipment, index) => (
                  <Motion
                    key={equipment.uuid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      className='cursor-pointer transition-all hover:shadow-lg hover:scale-105'
                      onClick={() => handleEquipmentClick(equipment.uuid)}
                    >
                      <CardContent className='p-6'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-3'>
                              {equipment.type === 'placement' ? (
                                <Building2 className='h-5 w-5 text-primary' />
                              ) : (
                                <Package className='h-5 w-5 text-primary' />
                              )}
                              <Typography variant='body2' className='text-muted-foreground capitalize'>
                                {equipment.type === 'placement' ? 'Placement' : 'Linked Structure'}
                              </Typography>
                            </div>

                            <Typography variant='h4' className='mb-2 font-semibold'>
                              {equipment.identification}
                            </Typography>

                            {equipment.subIdentification && (
                              <Typography variant='body2' className='text-muted-foreground mb-3'>
                                {equipment.subIdentification}
                              </Typography>
                            )}

                            <Typography variant='body2' className='text-xs text-muted-foreground'>
                              UUID: {equipment.uuid}
                            </Typography>
                          </div>

                          <ArrowRight className='h-5 w-5 text-muted-foreground' />
                        </div>
                      </CardContent>
                    </Card>
                  </Motion>
                ))}
              </Grid>
            )}
          </div>
        </Motion>
      </Container>
      <BottomNavigation />
    </div>
  )
}

export default ProjectDashboard
