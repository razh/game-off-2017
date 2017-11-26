'use strict';

module.exports = {
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  env: {
    browser: true,
  },
  rules: {
    'import/extensions': ['error', 'always'],
    'no-plusplus': 'off',
  },
  overrides: [
    {
      files: 'prettier.config.js',
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
};
