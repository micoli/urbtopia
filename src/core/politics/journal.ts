import type { GameState } from '../engine/state';
import type { PoliticsState } from './politics';
import { POLITICS } from './politicsBalance';

export const JOURNAL_TYPES = ['objectiveCompleted', 'petitionFiled', 'petitionHandled', 'demonstration', 'ordinanceLapsed', 'election'] as const;

export type JournalType = (typeof JOURNAL_TYPES)[number];

// What the politics did by itself on a game day, kept so the Mayor can read what happened while away.
export interface JournalEntry {
  day: number;
  type: JournalType;
  // The Objective, the Ordinance or the cause of the Petition it is about.
  subject?: string;
}

const entry = (day: number, type: JournalType, subject?: string): JournalEntry => (subject === undefined ? { day, type } : { day, type, subject });

export function journalEntriesOf(before: PoliticsState, after: PoliticsState): JournalEntry[] {
  const day = after.day;
  const idsOf = (politics: PoliticsState) => new Set(politics.petitions.map(petition => petition.id));
  const stillOpen = idsOf(after);
  const known = idsOf(before);
  return [
    ...before.objectives.filter(objective => !after.objectives.some(other => other.id === objective.id)).map(objective => entry(day, 'objectiveCompleted', objective.id)),
    ...after.petitions.filter(petition => !known.has(petition.id)).map(petition => entry(day, 'petitionFiled', petition.cause)),
    ...before.petitions.filter(petition => !stillOpen.has(petition.id)).map(petition => entry(day, 'petitionHandled', petition.cause)),
    ...after.petitions.filter(petition => petition.escalated && before.petitions.some(other => other.id === petition.id && !other.escalated)).map(petition => entry(day, 'demonstration', petition.cause)),
    ...before.adopted.filter(id => !after.adopted.includes(id)).map(id => entry(day, 'ordinanceLapsed', id)),
    ...(after.lastElection && after.lastElection.day === day && before.lastElection?.day !== day ? [entry(day, 'election')] : []),
  ];
}

export function withJournal(before: PoliticsState, after: PoliticsState): PoliticsState {
  return { ...after, journal: [...after.journal, ...journalEntriesOf(before, after)].slice(-POLITICS.journalSize) };
}

// The entries a replay added, for the digest shown on return.
export function newJournalEntries(before: GameState, after: GameState): JournalEntry[] {
  if (!before.politics || !after.politics) return [];
  const since = before.politics.day;
  return after.politics.journal.filter(item => item.day > since);
}
