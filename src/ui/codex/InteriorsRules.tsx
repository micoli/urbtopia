import type { BuildingType, GameState } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { InteriorCodexEntry } from './InteriorCodexEntry';
import { InteriorEntryLink } from './InteriorEntryLink';

interface InteriorsRulesProps {
  state: GameState;
  types: readonly BuildingType[];
  title: MessageKey;
  intro: MessageKey;
}

export function InteriorsRules({ state, types, title, intro }: InteriorsRulesProps) {
  return (
    <>
      <h3 className="codex-entry-name">{t(title)}</h3>
      <ul>
        {types.map(type => <li key={type}><InteriorEntryLink type={type} /></li>)}
      </ul>
      <p>{t(intro)}</p>
      {types.map(type => <InteriorCodexEntry key={type} state={state} type={type} />)}
    </>
  );
}
