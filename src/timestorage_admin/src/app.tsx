import 'src/global.css';
import { useEffect, useState } from 'react';
import { Router } from 'src/routes/sections';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';
import { ThemeProvider } from 'src/theme/theme-provider';
import { Iconify } from 'src/components/iconify';
import { useAuthStore } from './store/auth.store';

// ----------------------------------------------------------------------

const PUBLIC_ROUTES = ['/sign-in', '/sign-up', '/404'];

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const navigate = useNavigate();
  const location = useLocation();

  useScrollToTop();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await useAuthStore.getState().init();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

      if (!isAuthenticated && !isPublicRoute) {
        // Redirect to sign-in while preserving the intended destination
        navigate('/sign-in', {
          state: { from: location.pathname },
          replace: true,
        });
      } else if (isAuthenticated && location.pathname === '/sign-in') {
        // Redirect to home if already authenticated and trying to access sign-in
        navigate('/', { replace: true });
      }
    }
  }, [isInitialized, isAuthenticated, location.pathname, navigate]);

  if (!isInitialized) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const githubButton = (
    <Fab
      size="medium"
      aria-label="Github"
      href="https://github.com/timestorage-project/timestorage"
      sx={{
        zIndex: 9,
        right: 20,
        bottom: 20,
        width: 44,
        height: 44,
        position: 'fixed',
        bgcolor: 'grey.800',
        color: 'common.white',
      }}
    >
      <Iconify width={24} icon="eva:github-fill" />
    </Fab>
  );

  return (
    <ThemeProvider>
      <Router />
      {githubButton}
    </ThemeProvider>
  );
}
