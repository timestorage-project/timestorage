import { FC } from 'react'
import { Info, PlayCircle, Download, Wrench, Construction, FileText, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { Container } from '@/components/ui/container'
import { Grid } from '@/components/ui/grid'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { Motion, motion } from '@/components/ui/motion'
import BottomNavigation from '@/components/BottomNavigation'
import Header from '@/components/Header'
import ErrorView from '@/components/ErrorView'
import LoadingView from '@/components/LoadingView'

const Dashboard: FC = () => {
  const navigate = useNavigate()
  const { data, isLoading, error, projectId } = useData()

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

  const regularItems = Object.entries(data).filter(([_, item]) => !item.isWizard)
  const wizardItems = Object.entries(data).filter(([_, item]) => item.isWizard)

  return (
    <div className='min-h-screen '>
      <Header title={`PosaCheck - ${projectId}`} showMenu={true} />

      <Container maxWidth='sm' className='mt-8 mb-24 px-4'>
        <Motion variant='slideDown'>
          <Typography variant='h3' className='mb-6'>
            Dashboard Overview
          </Typography>
        </Motion>

        <Grid container className='gap-4'>
          {regularItems.map(([key, item], index) => (
            <Grid item xs={6} key={key}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Card
                  className='h-40 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 bg-card/80'
                  onClick={() => navigate(`/${projectId}/${key}`)}
                >
                  <CardContent className='p-4'>
                    <div className='mb-2 text-primary'>{getIconComponent(item.icon)}</div>
                    <Typography variant='h6' className='mb-1'>
                      {item.title}
                    </Typography>
                    <Typography variant='body2' color='muted'>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {wizardItems.length > 0 && (
          <Motion variant='slideDown' duration={0.5} delay={0.1}>
            <Typography variant='h3' className='mt-10 mb-4'>
              Installation Wizards
            </Typography>

            <Grid container spacing={4}>
              {wizardItems.map(([key, item], index) => (
                <Grid item xs={12} key={key}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                  >
                    <Card
                      className='h-40 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 bg-primary/5'
                      onClick={() => navigate(`/${projectId}/wizard/${key}`)}
                    >
                      <CardContent className='p-4'>
                        <div className='p-4'>{getIconComponent(item.icon, true)}</div>
                        <Typography variant='h6' className='mb-1'>
                          {item.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Motion>
        )}
      </Container>

      <BottomNavigation />
    </div>
  )
}

export default Dashboard
