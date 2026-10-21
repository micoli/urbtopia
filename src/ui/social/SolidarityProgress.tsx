import { SOLIDARITY, solidarityTier } from '../../core';
import { t } from '../../i18n/t';
import { ProgressBar } from '../common/ProgressBar';

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
    {target && <ProgressBar max={target} value={value} label={t('solidarity.medal.title')} />}
    {pendingValue > 0 && <p className="note note--muted">{t('solidarity.pending').replace('{value}', String(pendingValue))}</p>}
  </div>;
}
