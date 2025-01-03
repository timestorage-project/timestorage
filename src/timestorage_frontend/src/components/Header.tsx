import { FC } from 'react'
import { Box, Typography, IconButton, styled } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SyncIcon from '@mui/icons-material/Sync'
import ListIcon from '@mui/icons-material/List'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'

interface HeaderProps {
  title: string
  showBack?: boolean
  showMenu?: boolean
  showSync?: boolean
}

const Header: FC<HeaderProps> = ({ title, showBack = false, showMenu = false, showSync = true }) => {
  const navigate = useNavigate()
  const { reloadData } = useData()

  const handleLeftIconClick = () => {
    if (showBack) {
      navigate(-1)
    }
  }

  return (
    <HeaderRoot>
      <IconButton sx={{ color: '#000' }} onClick={handleLeftIconClick}>
        {showBack ? <MenuIcon /> : showMenu ? <ListIcon /> : <Box sx={{ width: 24 }} />}
      </IconButton>

      <Typography variant='h6'>{title}</Typography>

      {showSync ? (
        <IconButton sx={{ color: '#000' }} onClick={reloadData}>
          <SyncIcon />
        </IconButton>
      ) : (
        <Box sx={{ width: 48 }} /> // placeholder for spacing
      )}
    </HeaderRoot>
  )
}

const HeaderRoot = styled(Box)`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

export default Header
