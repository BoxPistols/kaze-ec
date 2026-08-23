/**
 * 色・角丸の値をここに書かない。すべて CSS 変数を参照するだけにする。
 *
 * 変数の実体は src/theme/cssVars.ts が MUI テーマから流し込む
 * （テーマの値は kaze MCP の get_token から来ている）。トークンの
 * 単一ソースを 1 本に保つための構造で、ここに hex を書いた時点で
 * tools/drift/check-drift.mjs の検査対象外の二重管理が生まれる
 */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: 'var(--kaze-font-family)',
      },
      colors: {
        primary: {
          DEFAULT: 'var(--kaze-color-primary)',
          contrast: 'var(--kaze-color-primary-contrast)',
        },
        secondary: {
          DEFAULT: 'var(--kaze-color-secondary)',
          contrast: 'var(--kaze-color-secondary-contrast)',
        },
        success: {
          DEFAULT: 'var(--kaze-color-success)',
          contrast: 'var(--kaze-color-success-contrast)',
        },
        warning: {
          DEFAULT: 'var(--kaze-color-warning)',
          contrast: 'var(--kaze-color-warning-contrast)',
        },
        error: {
          DEFAULT: 'var(--kaze-color-error)',
          contrast: 'var(--kaze-color-error-contrast)',
        },
        surface: {
          DEFAULT: 'var(--kaze-color-bg-paper)',
          muted: 'var(--kaze-color-bg-default)',
        },
        content: {
          DEFAULT: 'var(--kaze-color-text-primary)',
          muted: 'var(--kaze-color-text-secondary)',
        },
        divider: 'var(--kaze-color-divider)',
      },
      borderRadius: {
        kaze: 'var(--kaze-radius-md)',
        'kaze-lg': 'var(--kaze-radius-xl)',
      },
    },
  },
  plugins: [],
}
