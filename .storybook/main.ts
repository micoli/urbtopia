import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const storybookDir = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: { name: '@storybook/react-vite', options: { builder: { viteConfigPath: join(storybookDir, 'vite.config.ts') } } },
  staticDirs: ['../public'],
};

export default config;
