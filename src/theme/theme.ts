import { createTheme, type PaletteOptions, type Theme } from '@mui/material/styles'

export type ColorMode = 'light' | 'dark'

const FONT_FAMILY =
  'Inter, "Noto Sans JP", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif'

/**
 * 値の出どころは kaze MCP の get_token（実行済みクエリの記録は
 * design/screen-spec.json の foundations[]）。ここに新しい値を思いつきで
 * 足さない — 変えるときは kaze-ux 側のトークンを引き直す
 */
const LIGHT_PALETTE: PaletteOptions = {
  mode: 'light',
  primary: { main: '#0057B8', contrastText: '#ffffff' },
  secondary: { main: '#696881', contrastText: '#ffffff' },
  success: { main: '#46ab4a', contrastText: '#0A0A0A' },
  warning: { main: '#eb8117', contrastText: '#0A0A0A' },
  error: { main: '#da3737', contrastText: '#ffffff' },
  background: { default: '#f8fafc', paper: '#ffffff' },
  text: { primary: '#1a1a2e', secondary: '#4a5568', disabled: '#bdbdbd' },
  divider: 'rgba(0, 0, 0, 0.08)',
}

const DARK_PALETTE: PaletteOptions = {
  mode: 'dark',
  primary: { main: '#5AA9FF', contrastText: '#06182e' },
  secondary: { main: '#a0a0b8', contrastText: '#0A0A0A' },
  success: { main: '#6dce72', contrastText: '#1a2e1a' },
  warning: { main: '#f0a050', contrastText: '#2d1f0d' },
  error: { main: '#f18282', contrastText: '#2d1515' },
  background: { default: '#18181b', paper: '#27272a' },
  text: { primary: '#e4e4e7', secondary: '#a1a1aa', disabled: '#71717a' },
  divider: 'rgba(255, 255, 255, 0.08)',
}

export const createAppTheme = (mode: ColorMode): Theme =>
  createTheme({
    palette: mode === 'light' ? LIGHT_PALETTE : DARK_PALETTE,
    typography: {
      fontFamily: FONT_FAMILY,
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.2s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
    },
  })
