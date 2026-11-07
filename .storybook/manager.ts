import { addons } from 'storybook/manager-api';

const OPEN_ROOT = 'Main';

interface StorybookIndex {
  entries: Record<string, { title: string }>;
}

const index: StorybookIndex = await fetch('./index.json').then((response) => response.json());
const roots = new Set(Object.values(index.entries).map((entry) => entry.title.split('/')[0]));

addons.setConfig({
  sidebar: { collapsedRoots: [...roots].filter((root) => root !== OPEN_ROOT).map((root) => root.toLowerCase().replace(/[^a-z0-9]+/g, '-')) },
});
