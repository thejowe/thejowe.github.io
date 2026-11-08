import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      '.cache/',
      'node_modules/',
      'tests/artifacts/',
      'public/',
      'skills-propias/',
      '.agents/',
      '.claude/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
