import { FC } from 'react'
import { Box, Container, Grid, Typography, styled, Paper } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DownloadIcon from '@mui/icons-material/Download'
import BuildIcon from '@mui/icons-material/Build'
import { useNavigate } from 'react-router-dom/dist'
import BottomNavigation from '@/components/BottomNavigation'
import { useData } from '@/context/DataContext'
import Header from '../components/Header'
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
    return <div>No data available</div>
  }

  const getIconComponent = (iconName: string, isWizard?: boolean) => {
    if (isWizard) return <PlayArrowIcon />
    switch (iconName) {
      case 'info':
        return <InfoIcon />
      case 'download':
        return <DownloadIcon />
      case 'build':
        return <BuildIcon />
      default:
        return <InfoIcon />
    }
  }
  const regularItems = Object.entries(data).filter(([_, item]) => !item.isWizard)
  const wizardItem = Object.entries(data).find(([_, item]) => item.isWizard)
  return (
    <Root>
      <Header title={`Window Installation - ${projectId}`} showMenu={true} />

      <Container maxWidth='sm' sx={{ mt: 4, mb: 10 }}>
        <Typography variant='h5' sx={{ mb: 3 }}>
          Dashboard Overview
        </Typography>

        <Grid container spacing={2}>
          {regularItems.map(([key, item]) => (
            <Grid item xs={6} key={key}>
              <StyledCard onClick={() => navigate(`/${projectId}/${key}`)}>
                <Box sx={{ color: '#2e7d32', mb: 1 }}>{getIconComponent(item.icon)}</Box>
                <Typography variant='h6'>{item.title}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {item.description}
                </Typography>
              </StyledCard>
            </Grid>
          ))}
        </Grid>

        {wizardItem && (
          <WizardCard onClick={() => navigate(`/${projectId}/wizard`)} sx={{ mt: 3 }}>
            <Box sx={{ color: '#ffffff', mb: 1 }}>{getIconComponent(wizardItem[1].icon, true)}</Box>
            <Typography variant='h6' sx={{ color: '#ffffff' }}>
              {wizardItem[1].title}
            </Typography>
            <Typography variant='body2' sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {wizardItem[1].description}
            </Typography>
          </WizardCard>
        )}
      </Container>

      <BottomNavigation />
    </Root>
  )
}

const Root = styled('div')`
  min-height: 100vh;
  background-color: #f5f5f5;
`

const StyledCard = styled(Paper)`
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  border-radius: 12px;
  background-color: #e8f5e9;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;

  &:hover {
    background-color: #c8e6c9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`

const WizardCard = styled(Paper)`
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  border-radius: 12px;
  background-color: #2e7d32;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;

  &:hover {
    background-color: #1b5e20;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  & .MuiSvgIcon-root {
    font-size: 2rem;
  }
`

export default Dashboard
