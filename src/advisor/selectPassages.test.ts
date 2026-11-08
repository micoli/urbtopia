import { describe, expect, it } from 'vitest';
import { isAboutCity, selectPassages } from './selectPassages';

const passages = [
  { title: 'Déchets - Trois installations', text: 'Une décharge traite une quantité par jour. L’incinérateur baisse le bien-être alentour.' },
  { title: 'Mobilité - Les routes', text: 'Une route sature quand le trafic dépasse sa capacité.' },
  { title: 'Énergie', text: 'Le charbon pollue, l’éolien dépend du vent.' },
];

describe('selectPassages', () => {
  it('finds the passage a question is about, forgiving plurals and accents', () => {
    expect(selectPassages(passages, 'Que fait une décharge des déchets ?')[0]?.title).toBe('Déchets - Trois installations');
  });

  it('needs two meaningful words in one passage when no word is rare', () => {
    expect(selectPassages(passages, 'Une route et du charbon')).toEqual([]);
  });

  it('accepts a single meaningful word', () => {
    expect(selectPassages(passages, 'charbon ?').map(({ title }) => title)).toEqual(['Énergie']);
  });

  it('returns nothing for a question of stop words', () => {
    expect(selectPassages(passages, 'why is it so')).toEqual([]);
  });

  it('keeps at most two passages, each shortened', () => {
    const long = { title: 'Route', text: `route ${'mot. '.repeat(500)}` };
    const picked = selectPassages([long, long, long], 'route');
    expect(picked).toHaveLength(2);
    expect(picked[0]!.text.length).toBeLessThanOrEqual(900);
  });
});

describe('isAboutCity', () => {
  it.each(['Why are my roads jammed?', 'Pourquoi mes routes sont-elles bouchées ?', 'What should I do first?'])('%s is about the city', (question) => {
    expect(isAboutCity(question)).toBe(true);
  });

  it.each(['How does a landfill work?', 'Comment fonctionne une décharge ?'])('%s is about the rules', (question) => {
    expect(isAboutCity(question)).toBe(false);
  });
});
