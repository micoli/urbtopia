import { FACTION_IDS, ORDINANCE_ENTRIES } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { ordinanceEffectText } from './ordinanceEffectText';

const signed = (stance: number): string => `${stance > 0 ? '+' : ''}${stance}`;

function groupLabel(group: string): string {
  const key = `codex.politics.group.${group}` as MessageKey;
  const label = t(key);
  return label ?? group;
}

export function OrdinanceRulesTable() {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.politics.ordinance')}</th>
            <th scope="col">{t('codex.politics.ordinance.unlock')}</th>
            <th scope="col">{t('codex.politics.ordinance.upkeep')}</th>
            {FACTION_IDS.map(faction => <th key={faction} scope="col">{t(`faction.${faction}`)}</th>)}
            <th scope="col">{t('codex.politics.ordinance.effect')}</th>
          </tr>
        </thead>
        <tbody>
          {ORDINANCE_ENTRIES.map(entry => (
            <tr key={entry.id}>
              <th scope="row">
                {t(`ordinance.${entry.id}.name` as MessageKey)}
                {entry.popular ? ` · ${t('codex.politics.ordinance.popular')}` : ''}
                {entry.exclusiveGroup ? <small> · {t('codex.politics.ordinance.excludes')}: {groupLabel(entry.exclusiveGroup)}</small> : null}
              </th>
              <td>{entry.unlockCitizens}</td>
              <td>{entry.upkeepPerDay}</td>
              {FACTION_IDS.map(faction => <td key={faction}>{signed(entry.stances[faction])}</td>)}
              <td>{ordinanceEffectText(entry.effect)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
