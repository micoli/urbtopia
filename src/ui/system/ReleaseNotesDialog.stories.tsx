import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReleaseNotesDialog } from './ReleaseNotesDialog';

const meta = {
  title: 'Main/System/ReleaseNotesDialog',
  component: ReleaseNotesDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    language: 'en',
    index: 0,
    onSelect: () => {},
    onClose: () => {},
    notes: [
      { id: '2026.11.08.02-softly-vivid-fox-1116', publishedAt: '2026-11-08T12:48:45Z', title: { en: '🍽️ Restaurants and rotating rooms', fr: '🍽️ Restaurants et salles pivotantes' }, items: { en: ['🍽️ A new **Restaurant** venue is ready to build.', '🔄 Two buttons rotate the room of a venue.'], fr: ['🍽️ Un nouveau lieu, le **restaurant**, est prêt à construire.', '🔄 Deux boutons font pivoter la salle d\'un lieu.'] } },
      { id: '2026.11.08.01-smoothly-graceful-moose-9149', publishedAt: '2026-11-08T08:05:26Z', title: { en: '🌿 Hedges', fr: '🌿 Haies' }, items: { en: ['🌿 **Hedges** join into corners, Ts and crosses.'], fr: ['🌿 Les **haies** se raccordent en coins, T et croix.'] } },
    ],
  },
} satisfies Meta<typeof ReleaseNotesDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Older: Story = { args: { index: 1 } };
