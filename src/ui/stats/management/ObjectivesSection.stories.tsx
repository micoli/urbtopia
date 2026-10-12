import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../.storybook/WithCityStats';
import { ObjectivesSection } from './ObjectivesSection';

const meta = { title: 'Stats/ObjectivesSection', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <ObjectivesSection state={s.state} energy={s.energy} green={s.green} transport={s.transport} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
