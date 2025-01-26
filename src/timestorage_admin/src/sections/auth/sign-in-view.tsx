// src/sections/auth/sign-in-view.tsx
import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { IconButton } from '@mui/material';
import { authService } from './auth';

export function SignInView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const principal = await authService.login();
      if (principal) {
        router.push('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <>
      <Box gap={1.5} display="flex" flexDirection="column" alignItems="center" sx={{ mb: 5 }}>
        <Typography variant="h5">Sign in</Typography>
        <Typography variant="body2" color="text.secondary">
          Don’t have an account?
          <Link variant="subtitle2" sx={{ ml: 0.5 }}>
            Get started
          </Link>
        </Typography>
      </Box>

      <Box display="flex" flexDirection="column" alignItems="center">
        <LoadingButton
          fullWidth
          size="large"
          color="inherit"
          variant="contained"
          onClick={handleSignIn}
          loading={loading}
        >
          Sign in with Internet Identity
        </LoadingButton>
      </Box>
    </>
  );
}
