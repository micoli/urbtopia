import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, createClub, FOOTBALL_RULES, type Building } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ClubPanel } from './ClubPanel';
import { ClubTableTab } from './ClubTableTab';
import { startChampionship } from '../../core';

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));
vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ label, value }: { label: string; value: React.ReactNode }) => <p>{label}: {value}</p>,
  }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const stadium = (withClub: boolean): Building => ({ ...createBuilding(1, 'footballStadium', 60, 60, 0), ...(withClub ? { club: startChampionship(createClub(FOOTBALL_RULES, 'Harbour Herons', 'seed'), 0) } : {}) });

describe('ClubPanel', () => {
  it.each(['en', 'fr'] as const)('offers to found a Club in %s while the stadium has none', language => {
    prefsStore.getState().setLanguage(language);
    const html = renderToStaticMarkup(<ClubPanel building={stadium(false)} />);
    expect(html).toContain(t('club.found'));
    expect(html).not.toContain(t('club.manage'));
  });

  it('offers to manage the Club with its budget, year, Fame and ranking once founded', () => {
    const html = renderToStaticMarkup(<ClubPanel building={stadium(true)} />);
    expect(html).toContain(t('club.manage'));
    expect(html).toContain(t('club.budget'));
    expect(html).toContain(t('club.rank'));
  });
});

describe('ClubTableTab', () => {
  it('lists the Club and its seven opponents, and the ten fixtures', () => {
    const html = renderToStaticMarkup(<ClubTableTab building={stadium(true)} />);
    expect(html).toContain('Harbour Herons');
    expect(html.match(/<tr/g)).toHaveLength(1 + 8);
    expect(html.match(/<li/g)).toHaveLength(10);
  });
});
