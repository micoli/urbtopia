import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Cause } from '../../../core';
import { DiagnosisPanel } from './DiagnosisPanel';

const meta = { title: 'Stats/DiagnosisPanel' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const cause = (key: string, weight: number, focus: Cause['focus'] = []): Cause => ({ key, weight, params: {}, focus });

export const One: Story = { render: () => <DiagnosisPanel diagnosis={{ causes: [cause('diagnosis.title', 0.6, [{ x: 3, y: 4 }])] }} /> };
export const Three: Story = { render: () => <DiagnosisPanel diagnosis={{ causes: [cause('diagnosis.title', 0.6), cause('diagnosis.showOnMap', 0.4), cause('diagnosis.title', 0.2)] }} /> };
export const Empty: Story = { render: () => <DiagnosisPanel diagnosis={{ causes: [] }} /> };
