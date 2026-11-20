import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const slotModels = fileURLToPath(new URL('../../assets/managed-models/architect', import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    react(),
    {
      // The slot models live outside the root: watch them so that a regenerated or new model is picked up.
      name: 'watch-slot-models',
      configureServer: (server) => void server.watcher.add(slotModels),
    },
  ],
  server: { fs: { allow: ['../..'] } },
});
