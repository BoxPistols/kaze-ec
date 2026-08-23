import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'

import { applyCssVars } from '@/theme/cssVars'
import { createAppTheme, type ColorMode } from '@/theme/theme'

interface ColorModeContextValue {
  mode: ColorMode
  toggle: () => void
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null)

const STORAGE_KEY = 'kaze-ec:color-mode'

const readInitialMode = (): ColorMode => {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ColorMode>(readInitialMode)

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggle: () =>
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light'
          window.localStorage.setItem(STORAGE_KEY, next)
          return next
        }),
    }),
    [mode]
  )

  const theme = useMemo(() => createAppTheme(mode), [mode])

  // Tailwind 側（CVA 部品）が参照する CSS 変数へテーマの値を流す
  useEffect(() => {
    applyCssVars(theme)
  }, [theme])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export const useColorMode = (): ColorModeContextValue => {
  const ctx = useContext(ColorModeContext)
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider')
  return ctx
}
