import { FC, useEffect } from 'react'
import { Box, Container, Typography, Paper, styled } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import LoginButton from '@/components/LoginButton'
import { useAuthStore } from '@/store/auth.store'

const LoginPage: FC = () => {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state: { isAuthenticated: boolean }) => state.isAuthenticated)

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  return (
    <Container maxWidth='sm'>
      <StyledPaper elevation={3}>
        <Typography variant='h4' component='h1' gutterBottom textAlign='center'>
          Welcome to TimeStorage
        </Typography>
        <Typography variant='body1' color='text.secondary' paragraph textAlign='center'>
          Please login to access your projects and data
        </Typography>

        <Box sx={{ mt: 4 }}>
          <LoginButton fullWidth />
        </Box>
      </StyledPaper>
    </Container>
  )
}

const StyledPaper = styled(Paper)(({ theme }: { theme: { spacing: (arg0: number) => string } }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: 16
}))

export default LoginPage
