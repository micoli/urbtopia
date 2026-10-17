import { SOLIDARITY, solidarityTier } from '../../core';
import { t } from '../../i18n/t';

interface SolidarityProgressProps {
  value: number;
  pendingValue?: number;
}

export function SolidarityProgress({ value, pendingValue = 0 }: SolidarityProgressProps) {
  const tier = solidarityTier(value);
  const target = SOLIDARITY.medalThresholds[tier];
  const tierName = tier === 0 ? t('solidarity.tier.bronze') : tier === 1 ? t('solidarity.tier.silver') : t('solidarity.tier.gold');
  return <div className="solidarity-progress">
    <strong>{t('solidarity.medal.title')}</strong>
    <p>{target
      ? t('solidarity.medal.progress').replace('{value}', String(value)).replace('{target}', String(target)).replace('{tier}', tierName)
      : t('solidarity.medal.gold').replace('{value}', String(value))}</p>
    {target && <progress max={target} value={Math.min(value, target)} aria-label={t('solidarity.medal.title')} />}
    {pendingValue > 0 && <p className="note note--muted">{t('solidarity.pending').replace('{value}', String(pendingValue))}</p>}
  </div>;
}
