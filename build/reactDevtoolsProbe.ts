import type { Plugin } from 'vite';

// The dev server loads hundreds of modules before the game's React runs, and the React DevTools extension gives up
// looking for React on a reload. A tiny script ahead of the game makes React visible right away.
export function reactDevtoolsProbe(): Plugin {
  return {
    name: 'react-devtools-probe',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler: (_html, context) => {
        if (context.path !== '/index.html') return [];
        return [{ tag: 'script', attrs: { type: 'module', src: '/src/devtools/reactProbe.ts' }, injectTo: 'head-prepend' }];
      },
    },
  };
}
