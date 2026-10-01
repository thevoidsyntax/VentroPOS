module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },

  plugins: ['@typescript-eslint', 'vitest'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:vitest/recommended',
  ],

  env: {
    node: true,
    es2022: true,
  },

  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
    }],
    '@typescript-eslint/no-non-null-assertion': 'off',

    // Allow TODO comments, warn on FIXME
    'no-warning-comments': ['warn', {
      terms: ['FIXME', 'BUG', 'HACK'],
      location: 'anywhere',
    }],

    // Console warnings
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Best practices
    'no-throw-literal': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // Import rules
    'sort-imports': ['error', {
      memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple', 'multiple-named'],
    }],

    // Node.js best practices
    'no-process-env': 'error',

    // Disable base rules that TypeScript handles better
    'no-unused-vars': 'off',
    'no-undef': 'off',

    // Vitest rules
    'vitest/consistent-test-it': ['error', {
      fn: 'test',
      withinDescribe: 'test',
    }],
  },

  overrides: [
    // Test files
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-unused-expressions': 'off',
        'vitest/no-disabled-tests': 'warn',
        'vitest/no-focused-tests': 'error',
      },
    },

    // Migration and seed files
    {
      files: ['migrations/**', 'seeds/**', 'scripts/**'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  },

  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    '*.config.js',
    '*.config.cjs',
  ],
};
