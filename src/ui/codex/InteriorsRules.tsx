import { CODEX_INTERIOR_TYPES } from '../../codex/interiorFigures';
import type { GameState } from '../../core';
import { t } from '../../i18n/t';
import { InteriorCodexEntry } from './InteriorCodexEntry';

interface InteriorsRulesProps {
  state: GameState;
}

export function InteriorsRules({ state }: InteriorsRulesProps) {
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.interiors.title')}</h3>
      <p>{t('codex.interiors.intro')}</p>
      {CODEX_INTERIOR_TYPES.map(type => <InteriorCodexEntry key={type} state={state} type={type} />)}
    </>
  );
}
