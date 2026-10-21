import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const forbiddenImports = ['three', 'three/*', 'react', 'react/*', 'react-dom', 'react-dom/*', 'zustand', 'zustand/*'];
const forbiddenGlobals = [
  'window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB', 'fetch', 'performance', 'crypto',
  'Worker', 'HTMLElement', 'requestAnimationFrame', 'setTimeout', 'setInterval',
];

export default tseslint.config(
  { ignores: ['**/dist','prototypes', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: forbiddenImports }],
      'no-restricted-globals': [
        'error',
        ...forbiddenGlobals.map((name) => ({ name, message: 'The core must not touch DOM, timers or ambient time.' })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded PRNG.' },
        { object: 'Date', property: 'now', message: 'Receive `now` from the caller.' },
        { object: 'Date', property: 'parse', message: 'Parse dates outside the core.' },
        { object: 'Date', property: 'UTC', message: 'Compute dates outside the core.' },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Receive `now` from the caller.' },
      ],
    },
  },
  {
    files: ['src/ui/**/*.tsx'],
    ignores: ['src/ui/common/**', '**/*.stories.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "JSXOpeningElement[name.name='progress']", message: 'Use ProgressBar from ui/common.' },
        { selector: "JSXAttribute[name.name='role'][value.value='tablist']", message: 'Use Tabs from ui/common.' },
        { selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression > Property[value.type='Literal']", message: 'Static inline style: put it in the stylesheet with the tokens.' },
      ],
    },
  },
);
