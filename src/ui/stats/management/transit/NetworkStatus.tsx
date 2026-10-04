import { brokenLinkCount, type transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { gameStore } from '../../../../store/gameStore.ts';
import { ActionButton } from '../../../common/ActionButton.tsx';
import { useGame } from '../../../common/hooks.ts';

const NETWORK_MODES = ['brt', 'rail'] as const;

export function NetworkStatus({ transport }: { transport: ReturnType<typeof transportStats> }) {
  const state = useGame(s => s.state);
  return <>
    <p>{t('transit.help')}</p>
    <p>{t('transit.coverage')}</p>
    <p>{t('transit.transfers')}: {transport.transferRiders.toFixed(1)} · {t('transit.coal')}: {transport.coalPerHour.toFixed(2)}</p>
    {NETWORK_MODES.map(mode => {
      const broken = brokenLinkCount(state, mode);
      if (!broken) return null;
      return <div className="transit-error" role="alert" key={mode}>
        <p>⚠️ {t(`transit.${mode}`)} · {t('transit.broken')} ({broken})</p>
        <ActionButton variant="primary" onClick={() => gameStore.getState().send({ type: 'RepairTransitNetwork', mode })}>{t('transit.repair')}</ActionButton>
      </div>;
    })}
  </>;
}
