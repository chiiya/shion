module.exports = {
  root: true,
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: 'tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
};
