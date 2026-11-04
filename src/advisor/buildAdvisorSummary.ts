import { approvalOf, isHomeType, needsPyramid, totalCitizens, type Cause, type GameState, type NeedLevelId } from '../core';
import type { Language } from '../i18n/prefsStore';
import type { MessageKey } from '../i18n/messages';
import { messageIn } from './messageIn';

export interface AdvisorSummary {
  citizens: number;
  approval: number | null;
  needs: readonly { level: NeedLevelId; satisfaction: number | null }[];
  homesByTier: Readonly<Record<number, number>>;
  causes: readonly Pick<Cause, 'key' | 'weight' | 'params'>[];
}

const MAX_CAUSES = 3;

export function buildAdvisorSummary(state: GameState, causes: readonly Cause[]): AdvisorSummary {
  const approval = approvalOf(state);
  const homesByTier: Record<number, number> = {};
  for (const building of state.buildings) {
    if (!isHomeType(building.type)) continue;
    homesByTier[building.tier] = (homesByTier[building.tier] ?? 0) + 1;
  }
  return {
    citizens: totalCitizens(state),
    approval: approval === null ? null : Math.round(approval),
    needs: needsPyramid(state).levels.map(({ id, satisfaction }) => ({ level: id, satisfaction: satisfaction === null ? null : Math.round(satisfaction) })),
    homesByTier,
    causes: [...causes].sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key)).slice(0, MAX_CAUSES).map(({ key, weight, params }) => ({ key, weight, params })),
  };
}

export function summaryToText(summary: AdvisorSummary, language: Language): string {
  const label = (key: MessageKey) => messageIn(language, key);
  const unknown = label('advisor.summary.unknown');
  const needs = summary.needs.map(({ level, satisfaction }) => `${label(`advisor.level.${level}` as MessageKey)} ${satisfaction ?? unknown}`).join(', ');
  const tiers = Object.entries(summary.homesByTier).map(([tier, count]) => `${tier}: ${count}`).join(', ');
  const causes = summary.causes.length === 0
    ? label('advisor.summary.noCauses')
    : summary.causes.map(({ key, params }, index) => `${index + 1}. ${messageIn(language, key as MessageKey, params)}`).join(' ');
  return [
    `${label('advisor.summary.title')}:`,
    `${label('advisor.summary.citizens')}: ${summary.citizens}`,
    `${label('advisor.summary.approval')}: ${summary.approval ?? unknown}`,
    `${label('advisor.summary.needs')}: ${needs}`,
    `${label('advisor.summary.tiers')}: ${tiers || '-'}`,
    `${label('advisor.summary.causes')}: ${causes}`,
  ].join('\n');
}
