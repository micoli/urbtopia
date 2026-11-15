import { useMemo } from 'react';
import type { FixturePage } from '../../codex/fixturePages';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';

interface FixtureLiveProps {
  page: FixturePage;
}

export function FixtureLive({ page }: FixtureLiveProps) {
  const buildings = useGame(store => store.state.buildings);
  const { count, interiors, broken } = useMemo(() => {
    const placed = buildings.map(building => (building.venue ?? building.interior)?.fixtures.filter(fixture => page.fixtures.includes(fixture.type)) ?? []);
    return { count: placed.flat().length, interiors: placed.filter(fixtures => fixtures.length > 0).length, broken: placed.flat().filter(fixture => fixture.broken).length };
  }, [buildings, page]);
  return (
    <>
      <h4>{t('codex.fixtures.yours')}</h4>
      <p>{count === 0 ? t('codex.fixtures.liveNone') : t('codex.fixtures.live').replace('{count}', String(count)).replace('{interiors}', String(interiors))}{broken > 0 ? ` ${t('codex.fixtures.liveBroken').replace('{count}', String(broken))}` : ''}</p>
    </>
  );
}
