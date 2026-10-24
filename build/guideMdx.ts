import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import type { Plugin } from 'vite';

export function guideMdx(): Plugin {
  return { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) };
}
