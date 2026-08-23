import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/coverage',
      '*.config.js',
      '*.config.cjs',
      '*.config.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "TSTypeReference[typeName.name=/^(FC|FunctionComponent)$/]",
          message: 'React.FC / FunctionComponent は禁止。plain function + typed props を使う',
        },
        {
          selector: 'ExportDefaultDeclaration',
          message: 'export default は禁止。named export を使う',
        },
      ],
    },
  },
  {
    files: ['tools/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  eslintConfigPrettier
)
