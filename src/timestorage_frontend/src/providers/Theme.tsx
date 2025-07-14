import { ReactNode, useEffect } from 'react'

// Define an interface for your provider props
interface ThemeProviderProps {
  children: ReactNode
}

// This component will now primarily ensure the light theme is active for Tailwind/Shadcn
// by managing the .dark class on the html element.
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  useEffect(() => {
    // Ensure light theme is active by removing the .dark class
    const root = window.document.documentElement
    root.classList.remove('dark')

    // Optional: If your Shadcn setup or other parts of your app
    // look for a data-theme attribute, you can set it here.
    // root.setAttribute('data-theme', 'light')
  }, []) // Run only once on mount to set the light theme.

  // We no longer use MuiThemeProvider or CssBaseline from MUI.
  // Tailwind's preflight and your globals.css will handle base styles.
  return <>{children}</>
}
