import { useContext, useMemo, ReactNode } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'

import { ChosenTheme } from './ChosenTheme'

// Define an interface for your provider props
interface ThemeProviderProps {
  children: ReactNode
}

// Replace FC with explicit props type
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { theme } = useContext(ChosenTheme)
  const muiTheme = useMemo(() => createThemeHelper(theme), [theme])

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}

const brandColor = '#00b8d4'
const createThemeHelper = (theme: 'dark' | 'light') => {
  const isDark = theme === 'dark'
  return createTheme({
    palette: {
      mode: theme,
      background: {
        default: isDark ? '#303030;' : '#f0f0f0',
        paper: isDark ? '#242526' : '#ffffff'
      },
      primary: {
        main: brandColor
      },
      error: {
        main: 'rgb(232, 51, 51)'
      },
      success: {
        main: 'rgb(76,175,80)'
      }
    }
  })
}
