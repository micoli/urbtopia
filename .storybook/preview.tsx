import type { Preview } from '@storybook/react-vite';
import '@fontsource-variable/inter';
import './layered.css';
import type { GameFixtureName } from './fixtures';
import { withGame, type StoreOverrides } from './withGame';

declare module 'storybook/internal/csf' {
  interface Parameters {
    game?: GameFixtureName;
    stores?: StoreOverrides;
  }
}

const preview: Preview = {
  decorators: [withGame],
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    options: { storySort: { order: ['Main'] } },
    backgrounds: { options: { game: { name: 'Game', value: 'var(--color-surface-solid)' } } },
  },
  initialGlobals: { backgrounds: { value: 'game' } },
};

export default preview;
