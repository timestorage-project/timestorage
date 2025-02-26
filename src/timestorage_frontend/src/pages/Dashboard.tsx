import { FC } from 'react'
import { Box, Container, Grid, Typography, styled, Paper } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DownloadIcon from '@mui/icons-material/Download'
import BuildIcon from '@mui/icons-material/Build'
import ConstructionIcon from '@mui/icons-material/Construction'
import DescriptionIcon from '@mui/icons-material/Description'
import VerifiedIcon from '@mui/icons-material/Verified'

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
      case 'construction':
        return <ConstructionIcon />
      case 'description':
        return <DescriptionIcon />
      case 'verified':
        return <VerifiedIcon />
      default:
        return <InfoIcon />
    }
  }
  const regularItems = Object.entries(data).filter(([_, item]) => !item.isWizard)
  const wizardItems = Object.entries(data).filter(([_, item]) => item.isWizard)

  return (
    <Root>
      <Header title={`PosaCheck - ${projectId}`} showMenu={true} />

      <Container maxWidth='sm' sx={{ mt: 4, mb: 10 }}>
        <Typography variant='h5' sx={{ mb: 3 }}>
          Dashboard Overview
        </Typography>

        <Grid container spacing={2}>
          {regularItems.map(([key, item]) => (
            <Grid item xs={6} key={key}>
              <StyledCard onClick={() => navigate(`/${projectId}/${key}`)}>
                <Box sx={{ color: '#95bcf9', mb: 1 }}>{getIconComponent(item.icon)}</Box>
                <Typography variant='h6'>{item.title}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {item.description}
                </Typography>
              </StyledCard>
            </Grid>
          ))}
        </Grid>

        {wizardItems.length > 0 && (
          <>
            <Typography variant='h5' sx={{ mt: 4, mb: 2 }}>
              Installation Wizards
            </Typography>

            <Grid container spacing={2}>
              {wizardItems.map(([key, item]) => (
                <Grid item xs={12} key={key}>
                  <WizardCard onClick={() => navigate(`/${projectId}/wizard/${key}`)}>
                    <Box sx={{ mb: 1 }}>{getIconComponent(item.icon, true)}</Box>
                    <Typography variant='h6'>{item.title}</Typography>
                    <Typography variant='body2'>{item.description}</Typography>
                  </WizardCard>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      <BottomNavigation />
    </Root>
  )
}

const Root = styled('div')`
  min-height: 100vh;
  background-color: #f9fafb;
`

const StyledCard = styled(Paper)`
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  border-radius: 12px;
  background-color: #f6f7f8;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  height: 160px;
  justify-content: flex-start;

  &:hover {
    background-color: #dde9fd;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`

const WizardCard = styled(Paper)`
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  border-radius: 12px;
  background-color: #eef4fe;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  height: 160px;
  justify-content: flex-start;

  &:hover {
    background-color: #dde9fd;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  & .MuiSvgIcon-root {
    font-size: 2rem;
  }
`

export default Dashboard
