import { useMemo } from 'react';
import type { GameState, transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { SectionHeading } from '../../../common/SectionHeading';
import { ModeUsagePanel } from './ModeUsagePanel.tsx';
import { modeUsage, RAIL_METRO_MODES } from './modeUsage.ts';

interface RailMetroSectionProps {
  state: GameState;
  transport: ReturnType<typeof transportStats>;
}

export function RailMetroSection({ state, transport }: RailMetroSectionProps) {
  const usages = useMemo(() => RAIL_METRO_MODES.map(mode => modeUsage(state, transport, mode)), [state, transport]);
  return <section id="eco-railMetro">
    <SectionHeading icon="rail">{t('railMetro.title')}</SectionHeading>
    <p>{t('railMetro.help')}</p>
    {usages.map(usage => <ModeUsagePanel key={usage.mode} usage={usage} />)}
  </section>;
}
