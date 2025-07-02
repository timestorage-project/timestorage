import { FC } from 'react'
import { Info, PlayCircle, Download, Wrench, Construction, FileText, CheckCircle, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { Typography } from '@/components/ui/typography'
import { Motion } from '@/components/ui/motion'
import BottomNavigation from '@/components/BottomNavigation'
import Header from '@/components/Header'
import ErrorView from '@/components/ErrorView'
import LoadingView from '@/components/LoadingView'

const Dashboard: FC = () => {
  const navigate = useNavigate()
  const { data, isLoading, error, uuid, project } = useData()

  if (isLoading && !data) {
    return <LoadingView message='Loading dashboard...' />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  if (!data) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Typography variant='h4'>No data found</Typography>
      </div>
    )
  }

  const getIconComponent = (iconName: string, isWizard?: boolean) => {
    if (isWizard) return <PlayCircle className='h-6 w-6 text-primary' />

    switch (iconName) {
      case 'info':
        return <Info className='h-6 w-6 text-primary' />
      case 'download':
        return <Download className='h-6 w-6 text-primary' />
      case 'build':
        return <Wrench className='h-6 w-6 text-primary' />
      case 'construction':
        return <Construction className='h-6 w-6 text-primary' />
      case 'description':
        return <FileText className='h-6 w-6 text-primary' />
      case 'verified':
        return <CheckCircle className='h-6 w-6 text-primary' />
      default:
        return <PlayCircle className='h-6 w-6 text-primary' />
    }
  }

  const regularItems = Object.entries(data.nodes).filter(([_, item]) => !item.isWizard)
  const wizardItems = Object.entries(data.nodes).filter(([_, item]) => item.isWizard)

  return (
    <div className='min-h-screen bg-base-200'>
      <Header title={`PosaCheck - ${data.getIdentifier()}`} />

      <div className='container mx-auto px-4 py-8'>
        <Motion variant='slideDown'>
          <h1 className='text-3xl font-bold mb-6'>
            Dashboard Overview
          </h1>
        </Motion>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10'>
          {/* Project Dashboard Card - only show if project data exists */}
          {project && (
            <Motion variant="slideUp" duration={300}>
              <div 
                className='card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-40 border-2 border-primary/20 rounded-lg overflow-hidden'
                onClick={() => navigate(`/project/from-equipment/${uuid}`)}
              >
                <div className='card-body p-4'>
                  <div className='text-primary mb-2'>
                    <Building2 className='h-6 w-6' />
                  </div>
                  <h2 className='card-title text-lg font-semibold'>
                    Project Dashboard
                  </h2>
                  <p className='text-sm text-base-content/70'>
                    View all equipment in this project
                  </p>
                </div>
              </div>
            </Motion>
          )}
          
          {regularItems.map(([key, item], index) => (
            <Motion 
              key={key}
              variant="slideUp" 
              duration={300} 
              delay={(project ? index + 1 : index) * 100}
            >
              <div
                className='card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-40 rounded-lg overflow-hidden'
                onClick={() => navigate(`/view/${uuid}/${key}`)}
              >
                <div className='card-body p-4'>
                  <div className='text-primary mb-2'>{getIconComponent(item.icon)}</div>
                  <h2 className='card-title text-lg font-semibold'>
                    {item.title}
                  </h2>
                  <p className='text-sm text-base-content/70'>
                    {item.description}
                  </p>
                </div>
              </div>
            </Motion>
          ))}
        </div>

        {wizardItems.length > 0 && (
          <Motion variant='slideDown' duration={500} delay={100}>
            <h2 className='text-2xl font-bold mt-10 mb-4'>
              Installation Wizards
            </h2>

            <div className='space-y-4'>
              {wizardItems.map(([key, item], index) => (
                <Motion 
                  key={key}
                  variant="slideInLeft" 
                  duration={300} 
                  delay={400 + index * 100}
                >
                  <div
                    className='card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-32 rounded-lg overflow-hidden'
                    onClick={() => navigate(`/view/${uuid}/wizard/${key}`)}
                  >
                    <div className='card-body p-4 flex flex-row items-center'>
                      <div className='p-2 mr-4'>{getIconComponent(item.icon, true)}</div>
                      <h3 className='card-title text-lg font-semibold'>
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </Motion>
              ))}
            </div>
          </Motion>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default Dashboard
