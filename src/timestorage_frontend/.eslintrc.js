const prettierrc = require('rc')('./prettier')

module.exports = {
  extends: ['react-app'],
  plugins: ['prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 2,
    '@typescript-eslint/consistent-type-assertions': 'off', // Disable the rule causing problems
    'prettier/prettier': ['error', prettierrc]
  },
  parserOptions: {
    // Add these parser options
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
}
