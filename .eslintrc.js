module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // ============================================================================
    // CODE STYLE & FORMATTING
    // ============================================================================

    // Semicolons - enforce them for consistency and ASI protection
    'semi': ['error', 'always'],
    'semi-spacing': ['error', { before: false, after: true }],

    // Line length - professional standard
    'max-len': ['error', {
      code: 100,
      tabWidth: 2,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
      ignoreComments: true,
    }],

    // Indentation and spacing
    'indent': ['error', 2, { SwitchCase: 1 }],
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
    'eol-last': ['error', 'always'],

    // Quotes and templates
    'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],

    // Objects and arrays
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': ['error', { before: false, after: true }],

    // Functions
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always',
    }],
    'arrow-spacing': ['error', { before: true, after: true }],
    'arrow-parens': ['error', 'as-needed'],

    // ============================================================================
    // CODE QUALITY & COMPLEXITY
    // ============================================================================

    // Complexity limits
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],
    'max-params': ['warn', 4],
    'max-statements': ['warn', 20],
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],

    // Code quality
    'no-duplicate-imports': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'no-else-return': ['error', { allowElseIf: false }],
    'prefer-const': 'error',
    'no-var': 'error',

    // ============================================================================
    // BEST PRACTICES
    // ============================================================================

    // Error handling
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',

    // Variables
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    'no-undef': 'error',
    'no-redeclare': 'error',
    'no-shadow': 'warn',

    // General best practices
    'object-shorthand': 'error',
    'prefer-destructuring': ['error', { object: true, array: false }],

    // Naming conventions
    'camelcase': ['error', { properties: 'never', ignoreDestructuring: false }],

    // ============================================================================
    // IMPORTS & MODULES
    // ============================================================================
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: true, // We'll use import/order instead
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
    }],
  },
  overrides: [
    // ========================================================================
    // TYPESCRIPT FILES
    // ========================================================================
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        // Override base rules for TypeScript
        'no-unused-vars': 'off',
        'no-undef': 'off', // TypeScript handles this
        'no-redeclare': 'off',
        'no-shadow': 'off',
        'camelcase': 'off',
      },
    },

    // ========================================================================
    // REACT/NEXT.JS FILES (Web App)
    // ========================================================================
    {
      files: ['apps/web/**/*.{js,jsx,ts,tsx}'],
      extends: [
        'next/core-web-vitals',
      ],
      env: {
        browser: true,
        es2022: true,
      },
      rules: {
        // React-specific overrides
        'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      },
    },

    // ========================================================================
    // API/SERVER FILES (Node.js)
    // ========================================================================
    {
      files: ['apps/api/**/*.ts'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        // Server-specific rules
        'no-console': 'off', // Console logging is acceptable in server code
        'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      },
    },

    // ========================================================================
    // PACKAGE FILES (Shared Libraries)
    // ========================================================================
    {
      files: ['packages/**/*.ts'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        // Stricter rules for shared packages
        'no-console': 'error', // No console logs in shared packages
      },
    },

    // ========================================================================
    // TEST FILES
    // ========================================================================
    {
      files: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}', '**/__tests__/**'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        // Relaxed rules for tests
        'max-lines-per-function': 'off',
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'complexity': 'off',
      },
    },

    // ========================================================================
    // CONFIG FILES
    // ========================================================================
    {
      files: ['*.js', '*.mjs', '*.cjs', '**/*.config.{js,ts}'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
        'no-magic-numbers': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    '*.d.ts',
    'coverage/',
    '.turbo/',
  ],
};
