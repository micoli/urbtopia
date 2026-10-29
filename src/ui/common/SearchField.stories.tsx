import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchField } from './SearchField';

function SearchFieldDemo() {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: 320, padding: 16, borderRadius: 'var(--radius-2xl)', background: 'var(--color-surface-solid)', color: 'var(--color-text)' }}>
      <SearchField label="Search the codex" value={value} onChange={setValue} />
    </div>
  );
}

const meta = { title: 'Common/SearchField', component: SearchFieldDemo } satisfies Meta<typeof SearchFieldDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
