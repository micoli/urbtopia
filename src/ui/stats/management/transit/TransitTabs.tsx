import { useState } from 'react';
import type { transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { RadioChipGroup } from '../../../common/RadioChipGroup.tsx';
import { FleetManager } from './FleetManager.tsx';
import { TransitLines } from './TransitLines.tsx';

type Tab = 'lines' | 'fleet';

export function TransitTabs({ transport }: { transport: ReturnType<typeof transportStats> }) {
  const [tab, setTab] = useState<Tab>('lines');
  return <>
    <RadioChipGroup<Tab>
      label={t('eco.transport')}
      className="eco-tabs"
      chipClassName="eco-tab"
      value={tab}
      onChange={setTab}
      options={[{ value: 'lines', label: t('transit.lines') }, { value: 'fleet', label: t('transit.fleet') }]}
    />
    {tab === 'lines' ? <TransitLines transport={transport} /> : <FleetManager transport={transport} />}
  </>;
}
