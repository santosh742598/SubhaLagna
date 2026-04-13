import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';
import jsdoc from 'eslint-plugin-jsdoc';
import node from 'eslint-plugin-node';

export default [
  js.configs.recommended,
  security.configs.recommended,
  jsdoc.configs['flat/recommended'],
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      jsdoc,
      node,
    },
    rules: {
      strict: ['error', 'global'],
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
      'no-console': 'warn',

      // JSDoc Header Enforcement
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
          },
        },
      ],
      'jsdoc/check-tag-names': ['error', { definedTags: ['fileoverview', 'version'] }],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns-description': 'warn',

      // Custom rule to check for SubhaLagna standard header structure
      // (Simplified approach using built-in jsdoc rules)
      'jsdoc/check-values': [
        'error',
        {
          allowedAuthors: ['SubhaLagna Team'],
        },
      ],
    },
  },
  {
    ignores: ['node_modules/**', 'uploads/**', 'dist/**'],
  },
];
