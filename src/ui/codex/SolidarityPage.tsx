import { SOLIDARITY } from '../../core';
import { t } from '../../i18n/t';

export function SolidarityPage() {
  return <>
    <h3 className="codex-entry-name">{t('codex.solidarity.title')}</h3>
    <p>{t('codex.solidarity.intro')}</p>
    <p>{t('codex.solidarity.value')}</p>
    <h4>{t('codex.solidarity.reserveTitle')}</h4>
    <p>{t('codex.solidarity.reserve').replace('{bonus}', String(SOLIDARITY.wellbeingBonus))}</p>
    <p>{t('codex.solidarity.cost')}</p>
    <p>{t('codex.solidarity.clock')}</p>
    <p>{t('codex.solidarity.excess')}</p>
    <h4>{t('codex.solidarity.exampleTitle')}</h4>
    <p>{t('codex.solidarity.example')}</p>
    <h4>{t('codex.solidarity.medalTitle')}</h4>
    <p>{t('codex.solidarity.medal')}</p>
    <p>{t('codex.solidarity.offline')}</p>
  </>;
}
