module.exports = {
  extends: ['react-app'],
  plugins: ['prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 2,
    '@typescript-eslint/consistent-type-assertions': 'off', // Disable the rule causing problems
    semi: ['error', 'never']
  },
  overrides: [
    {
      // Disable problematic rules for declaration files
      files: ['*.d.ts'],
      rules: {
        semi: 'off',
        'comma-dangle': 'off',
        'trailing-comma': 'off'
      }
    }
  ],
  parserOptions: {
    // Add these parser options
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
}
