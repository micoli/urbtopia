import type { Demonstration, DemonstrationText } from './scenario';

type Level = Demonstration['level'];

export interface LevelIntro {
  title: DemonstrationText;
  objective: DemonstrationText;
  explanation: DemonstrationText;
  summary: DemonstrationText;
}

const LEVEL_NAMES: Record<Level, DemonstrationText> = {
  simple: ['Simple', 'Simple'],
  intermediate: ['Intermediate', 'Intermédiaire'],
  advanced: ['Advanced', 'Avancé'],
};

export const levelTitle = (building: DemonstrationText, level: Level): DemonstrationText =>
  [`${building[0]} — ${LEVEL_NAMES[level][0]}`, `${building[1]} — ${LEVEL_NAMES[level][1]}`];

const ORDINALS: readonly DemonstrationText[] = [['second', 'deuxième'], ['third', 'troisième'], ['fourth', 'quatrième']];

// Two pieces with the same label get an ordinal so that every step title is distinct.
export const placeTitle = (labels: readonly DemonstrationText[], index: number): DemonstrationText => {
  const label = labels[index]!;
  const rank = labels.slice(0, index).filter(other => other[0] === label[0]).length;
  const ordinal = ORDINALS[rank - 1];
  if (!ordinal) return [`Place ${label[0]}`, `Placer ${label[1]}`];
  return [`Place ${label[0].replace(/^(an?) /, `$1 ${ordinal[0]} `)}`, `Placer ${label[1].replace(/^(une?) /, `$1 ${ordinal[1]} `)}`];
};
