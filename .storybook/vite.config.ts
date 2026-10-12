import { defineConfig } from 'vite';

// The root config stamps a service worker and validates definitions for the production build: neither belongs in Storybook.
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify('storybook'), __RELEASE_NAME__: JSON.stringify('storybook') },
});
