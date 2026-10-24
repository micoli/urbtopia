import type { Plugin } from 'vite';

// The dev server would serve the game for a nested Guide path; prerendered files cover it in the build.
export function guideDevFallback(): Plugin {
  return {
    name: 'guide-dev-fallback',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url && /^\/docs\/[^.?]*(\?.*)?$/.test(request.url)) request.url = '/docs/index.html';
        next();
      });
    },
  };
}
