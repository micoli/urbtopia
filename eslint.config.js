import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const forbiddenImports = ['three', 'three/*', 'react', 'react/*', 'react-dom', 'react-dom/*', 'zustand', 'zustand/*'];

export default tseslint.config(
  { ignores: ['dist', 'prototypes', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: forbiddenImports }],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'requestAnimationFrame', 'setTimeout', 'setInterval'].map(
          (name) => ({ name, message: 'The core must not touch DOM or timers.' }),
        ),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded PRNG.' },
        { object: 'Date', property: 'now', message: 'Receive `now` from the caller.' },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Receive `now` from the caller.' },
      ],
    },
  },
);
