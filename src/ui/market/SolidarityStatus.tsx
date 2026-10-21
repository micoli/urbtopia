import { SOLIDARITY } from '../../core';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useCloud, useGame, useSocial, useSolidarity, useUi } from '../common/hooks';
import { formatSolidarityDuration } from './formatSolidarityDuration';
import { ProgressBar } from '../common/ProgressBar';

export function SolidarityStatus() {
  const remaining = useGame(store => store.state.solidarityMs ?? 0);
  const failed = useSolidarity(store => store.failed);
  const account = useCloud(store => store.account);
  const profile = useSocial(store => store.profile);
  const openCodex = useUi(store => store.openCodex);
  return <section className="solidarity-status" aria-label={t('solidarity.title')}>
    <h3>{t('solidarity.title')}</h3>
    <p>{remaining > 0
      ? t('solidarity.active').replace('{bonus}', String(SOLIDARITY.wellbeingBonus)).replace('{duration}', formatSolidarityDuration(remaining))
      : t('solidarity.inactive')}</p>
    <ProgressBar max={SOLIDARITY.durationMs} value={remaining} label={t('solidarity.title')} />
    {(!account?.email || !profile) && <p className="note note--muted">{t('solidarity.signIn')}</p>}
    {failed && <p role="status" className="note note--muted">{t('solidarity.syncFailed')}</p>}
    <ActionButton onClick={() => openCodex(undefined, 'solidarity')}>{t('solidarity.openCodex')}</ActionButton>
  </section>;
}
