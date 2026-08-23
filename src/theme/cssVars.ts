import type { Theme } from '@mui/material/styles'

/**
 * MUI テーマの値を CSS 変数として書き出す。Tailwind 側（tailwind.config.js）は
 * この変数だけを参照するので、**色・角丸の値がコード中に 2 箇所存在しない**。
 *
 * これは kaze-ec のハイブリッド構成の要。MUI 直使用の部品と Tailwind + CVA の
 * 部品が同じ画面に並んでも、両者は同じトークン（= kaze MCP から引いた値）を
 * 見ている状態を保てる
 */
export const applyCssVars = (theme: Theme): void => {
  const root = document.documentElement
  const vars: Record<string, string> = {
    '--kaze-font-family': theme.typography.fontFamily ?? '',
    '--kaze-color-primary': theme.palette.primary.main,
    '--kaze-color-primary-contrast': theme.palette.primary.contrastText,
    '--kaze-color-secondary': theme.palette.secondary.main,
    '--kaze-color-secondary-contrast': theme.palette.secondary.contrastText,
    '--kaze-color-success': theme.palette.success.main,
    '--kaze-color-success-contrast': theme.palette.success.contrastText,
    '--kaze-color-warning': theme.palette.warning.main,
    '--kaze-color-warning-contrast': theme.palette.warning.contrastText,
    '--kaze-color-error': theme.palette.error.main,
    '--kaze-color-error-contrast': theme.palette.error.contrastText,
    '--kaze-color-bg-default': theme.palette.background.default,
    '--kaze-color-bg-paper': theme.palette.background.paper,
    '--kaze-color-text-primary': theme.palette.text.primary,
    '--kaze-color-text-secondary': theme.palette.text.secondary,
    '--kaze-color-divider': theme.palette.divider,
    '--kaze-radius-md': `${theme.shape.borderRadius}px`,
    '--kaze-radius-xl': `${Number(theme.shape.borderRadius) * 1.5}px`,
  }

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
  root.dataset.theme = theme.palette.mode
}
