const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      '**/node_modules/**',
      '**/.expo/**',
      '**/dist/**',
      '**/dist-pages/**',
      '.agents/**',
      '.impeccable/**',
    ],
  },
  {
    settings: {
      'import/resolver': {
        typescript: { project: ['apps/mobile/tsconfig.json', 'packages/domain/tsconfig.json'] },
      },
    },
  },
  {
    files: ['apps/mobile/src/features/{social,events,marketplace}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/horse-database/*'],
              message:
                'Horse research is independent; do not couple social, events or marketplace to its UI/provider.',
            },
          ],
        },
      ],
    },
  },
]);
