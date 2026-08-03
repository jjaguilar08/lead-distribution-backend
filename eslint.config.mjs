import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsdoc from 'eslint-plugin-jsdoc';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
      },
    },
  },
  // require-jsdoc is intentionally scoped to service/controller files only:
  // those are where business logic and request handling live and most need
  // documented contracts. Types/DTOs, routes, and repositories are exempt.
  {
    files: ['src/modules/**/*.service.ts', 'src/modules/**/*.controller.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: [
            'ExportNamedDeclaration > FunctionDeclaration',
            'ExportNamedDeclaration > TSDeclareFunction',
            'ExportDefaultDeclaration > FunctionDeclaration',
            'MethodDefinition:not([kind="constructor"]):not([accessibility="private"])',
          ],
        },
      ],
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': 'error',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
