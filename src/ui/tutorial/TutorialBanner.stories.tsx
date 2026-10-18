import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GameState, TutorialStep } from '../../core';
import { gameStore } from '../../store/gameStore';
import { TutorialBanner } from './TutorialBanner';

const meta = { title: 'Tutorial/TutorialBanner', component: TutorialBanner, parameters: { layout: 'fullscreen', game: 'tutorial' } } satisfies Meta<typeof TutorialBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

const atStep = (tutorial: TutorialStep) => () => {
  const { state, replaceState } = gameStore.getState();
  replaceState({ ...state, tutorial });
};

export const Default: Story = {};

export const PlaceWorkshop: Story = { parameters: { stores: { setup: atStep('workshop') } } };

export const PlaceUtilities: Story = { parameters: { stores: { setup: atStep('utilities') } } };

export const SelectFactory: Story = { parameters: { stores: { setup: atStep('planks') } } };

export const French: Story = { parameters: { stores: { prefs: { language: 'fr' }, setup: atStep('shop') } } };

const venueAt = (venueTutorials: GameState['venueTutorials']) => () => {
  const { state, replaceState } = gameStore.getState();
  replaceState({ ...state, tutorial: null, venueTutorials });
};

export const ArcadeEmployee: Story = { parameters: { stores: { setup: venueAt({ arcade: 'employee' }) } } };

export const SupermarketStock: Story = { parameters: { stores: { setup: venueAt({ supermarket: 'stock' }) } } };

export const SupermarketFrench: Story = { parameters: { stores: { prefs: { language: 'fr' }, setup: venueAt({ supermarket: 'checkout' }) } } };
