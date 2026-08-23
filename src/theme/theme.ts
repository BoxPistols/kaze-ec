import { createTheme } from '@mui/material/styles'

/**
 * 値の出どころは kaze MCP の get_token（実行済みクエリの記録は
 * design/screen-spec.json）。ここに新しい値を思いつきで足さない —
 * 変えるときは kaze-ux 側のトークンを引き直す
 */
export const theme = createTheme({
  palette: {
    primary: { main: '#0057B8' },
    secondary: { main: '#696881' },
    success: { main: '#46ab4a' },
    warning: { main: '#eb8117' },
  },
  typography: {
    fontFamily:
      'Inter, "Noto Sans JP", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
})
