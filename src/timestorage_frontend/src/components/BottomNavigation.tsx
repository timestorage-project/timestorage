import { FC } from 'react'
import { Box, Typography, IconButton, styled } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
// import ListIcon from '@mui/icons-material/List'
// import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
// import PersonIcon from '@mui/icons-material/Person'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'

const BottomNavigation: FC = () => {
  const navigate = useNavigate()
  const { projectId } = useData()

  return (
    <Navigation>
      <IconButton onClick={() => navigate('/' + projectId)}>
        <HomeIcon />
        <Typography variant='caption' sx={{ mt: 0.5 }}>
          Home
        </Typography>
      </IconButton>
      {/* <IconButton onClick={() => navigate('/forms')} sx={{ color: isActive('/forms') ? '#95bcf9' : '#757575' }}>
        <ListIcon />
        <Typography variant='caption' sx={{ mt: 0.5 }}>
          Forms
        </Typography>
      </IconButton>
      <IconButton onClick={() => navigate('/gallery')} sx={{ color: isActive('/gallery') ? '#95bcf9' : '#757575' }}>
        <PhotoLibraryIcon />
        <Typography variant='caption' sx={{ mt: 0.5 }}>
          Gallery
        </Typography>
      </IconButton>
      <IconButton onClick={() => navigate('/profile')} sx={{ color: isActive('/profile') ? '#95bcf9' : '#757575' }}>
        <PersonIcon />
        <Typography variant='caption' sx={{ mt: 0.5 }}>
          Profile
        </Typography>
      </IconButton> */}
    </Navigation>
  )
}

const Navigation = styled(Box)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  background-color: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  & .MuiIconButton-root {
    flex-direction: column;
  }
`

export default BottomNavigation
