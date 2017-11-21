'use strict';

module.exports = {
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  env: {
    browser: true,
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
