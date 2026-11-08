import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import type { Plugin } from 'vite';

// `?raw` imports (the Advisor reads the articles as plain text) must reach the browser uncompiled.
export function guideMdx(): Plugin {
  const compiler = mdx({ remarkPlugins: [remarkGfm] });
  const compile = compiler.transform as (this: unknown, code: string, id: string) => unknown;
  return {
    ...compiler,
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('?raw')) return null;
      return compile.call(this, code, id) as never;
    },
  };
}
