import type { VenueFixture } from '../engine/state';

// What a result depends on is the layout of the Fixtures (what, where, turned how, broken or not), never their Condition. The wear of a floor that runs replaces its list at every
// tick, so a result is looked up by list first, then by layout, and worked out again only when the layout changed.
const layoutOf = (fixtures: readonly VenueFixture[]): string => fixtures.reduce((key, fixture) => `${key}${fixture.id},${fixture.type},${fixture.x},${fixture.y},${fixture.rotation},${fixture.broken === true ? 1 : 0},${fixture.recipe ?? ''},${fixture.soldGood ?? ''};`, '');

const LAYOUTS_KEPT = 64;

export const memoizedByLayout = <Result>(compute: (fixtures: readonly VenueFixture[]) => Result): ((fixtures: readonly VenueFixture[]) => Result) => {
  const byList = new WeakMap<readonly VenueFixture[], Result>();
  const byLayout = new Map<string, Result>();
  return fixtures => {
    const cached = byList.get(fixtures);
    if (cached !== undefined) return cached;
    const layout = layoutOf(fixtures);
    let result = byLayout.get(layout);
    if (result === undefined) {
      result = compute(fixtures);
      if (byLayout.size >= LAYOUTS_KEPT) byLayout.clear();
      byLayout.set(layout, result);
    }
    byList.set(fixtures, result);
    return result;
  };
};
