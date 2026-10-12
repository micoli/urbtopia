import type { Meta, StoryObj } from '@storybook/react-vite';
import { LabeledList } from './LabeledList';

const meta = { title: 'Common/LabeledList', component: LabeledList } satisfies Meta<typeof LabeledList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <LabeledList>
      <LabeledList.Row label="Residents">24</LabeledList.Row>
      <LabeledList.Row label="Tax">120 U / h</LabeledList.Row>
      <LabeledList.Row label="Happiness">82 %</LabeledList.Row>
    </LabeledList>
  ),
};
