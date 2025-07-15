import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default {
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
  },
};
