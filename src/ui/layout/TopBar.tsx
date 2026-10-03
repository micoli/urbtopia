import { CityStats } from '../stats/CityStats';
import { NextUnlock } from '../stats/NextUnlock';
import { UrbsStat } from '../common/UrbsStat';

export function TopBar() {
  return (
    <header className="top-bar">
      <UrbsStat />
      <CityStats />
      <NextUnlock />
    </header>
  );
}
