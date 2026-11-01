import { knowledgeCodexFigures, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { KnowledgeEffectsTable } from './KnowledgeEffectsTable';
import { KnowledgeSourcesTable } from './KnowledgeSourcesTable';

interface KnowledgeRulesProps {
  state: GameState;
}

export function KnowledgeRules({ state }: KnowledgeRulesProps) {
  const figures = knowledgeCodexFigures(state);
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.knowledge.title')}</h3>
      <p>{t('codex.knowledge.intro')}</p>
      <h4>{t('codex.knowledge.city')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.knowledge.cityKnowledge')}>{figures.knowledge === null ? t('codex.knowledge.noCitizens') : figures.knowledge.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.knowledge.homesBelow')}>{figures.belowRequired}</LabeledList.Row>
      </LabeledList>
      <h4>{t('codex.knowledge.sources')}</h4>
      <p>{t('codex.knowledge.sourcesHelp')}</p>
      <KnowledgeSourcesTable figures={figures} />
      <h4>{t('codex.knowledge.effects')}</h4>
      <p>{t('codex.knowledge.effectsHelp')}</p>
      <KnowledgeEffectsTable effects={figures.effects} />
      <h4>{t('codex.knowledge.sanction')}</h4>
      <p>{t('codex.knowledge.sanctionHelp').replace('{required}', String(figures.required))}</p>
    </>
  );
}
