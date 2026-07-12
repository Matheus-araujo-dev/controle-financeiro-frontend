import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Pastas/arquivos que não devem ser analisados.
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'src/types/generated',
      'playwright-report',
      'test-results',
    ],
  },

  // Bases recomendadas (JS + TypeScript, sem type-checking para manter rápido).
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      // --- React Hooks (conjunto clássico e estável) ---
      // O plugin v7 também traz regras experimentais do React Compiler
      // (set-state-in-effect, immutability, purity, etc.). Elas exigiriam
      // refatorações grandes e não fazem parte de um setup de lint; ficam
      // de fora até uma eventual adoção do React Compiler.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Mantém o Fast Refresh do Vite saudável (apenas componentes exportados).
      // Padrão do template oficial do Vite: warning, não erro.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript já cobre variáveis não declaradas; evita falsos positivos com tipos.
      'no-undef': 'off',

      // `any` é desencorajado, mas há usos legítimos em fronteiras genéricas;
      // registra como aviso em vez de quebrar o lint.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Permite "_" como prefixo para argumentos/variáveis intencionalmente ignorados.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Arquivos de definição de rotas exportam configuração (objetos/arrays),
  // não componentes — o Fast Refresh não se aplica a eles.
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Service Worker — usa globals do contexto serviceworker (self, clients, etc.)
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },

  // Arquivos de configuração e scripts rodam em Node.
  {
    files: [
      '*.config.{js,ts}',
      'scripts/**/*.{js,ts}',
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Arquivos de teste: habilita globais do Vitest/Node e relaxa regras.
  {
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
      'tests/**/*.{ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
);
