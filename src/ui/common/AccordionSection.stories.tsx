import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccordionSection } from './AccordionSection';

const meta = {
  title: 'Common/AccordionSection',
  component: AccordionSection,
  args: { id: 'accordion', title: 'Details', expanded: true, onToggle: () => {}, children: 'Section content' },
} satisfies Meta<typeof AccordionSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {};
export const Collapsed: Story = { args: { expanded: false } };
export const WithChevron: Story = { args: { chevron: true } };

export const Interactive: Story = {
  render: (args) => {
    const [expanded, setExpanded] = useState(false);
    return <AccordionSection {...args} chevron expanded={expanded} onToggle={() => setExpanded(!expanded)} />;
  },
};
