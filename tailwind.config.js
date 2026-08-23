/**
 * カラー・角丸は kaze MCP の get_token で取得した値をそのまま反映する。
 * ここに手で新しい値を書き足さない — 変える必要が出たら kaze-ux 側のトークンを
 * 引き直し、tools/drift/check-drift.mjs が不一致を検出できる状態を保つ
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans JP',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        primary: {
          main: '#0057B8',
        },
        secondary: {
          main: '#696881',
        },
        success: {
          main: '#46ab4a',
        },
        warning: {
          main: '#eb8117',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
