import { createContext, Dispatch, SetStateAction, ReactNode } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useLocalStorage } from '@caldwell619/react-hooks'

export const ChosenTheme = createContext<IChosenTheme>({} as IChosenTheme)

// Define an interface for your provider props
interface ChosenThemeProviderProps {
  children: ReactNode
}

// Replace FC with explicit props type
export const ChosenThemeProvider = ({ children }: ChosenThemeProviderProps) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const [theme, setTheme] = useLocalStorage<ThemeName>('theme', prefersDarkMode ? 'dark' : 'light', true)

  return <ChosenTheme.Provider value={{ theme, setTheme }}>{children}</ChosenTheme.Provider>
}

type ThemeName = 'dark' | 'light'
interface IChosenTheme {
  theme: ThemeName
  setTheme: Dispatch<SetStateAction<ThemeName>>
}
