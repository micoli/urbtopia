import { CityStats } from './CityStats';
import { NextUnlock } from './NextUnlock';
import { UrbsStat } from './UrbsStat';

export function TopBar() {
  return (
    <header className="top-bar">
      <UrbsStat />
      <CityStats />
      <NextUnlock />
    </header>
  );
}
