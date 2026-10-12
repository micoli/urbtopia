import type { Preview } from '@storybook/react-vite';
import '../src/styles.css';
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
  parameters: { layout: 'centered', controls: { expanded: true } },
};

export default preview;
