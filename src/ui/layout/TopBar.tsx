import { CityStats } from '../stats/CityStats';
import { UrbsStat } from '../common/UrbsStat';

export function TopBar() {
  return (
    <header className="top-bar">
      <UrbsStat />
      <CityStats />
    </header>
  );
}
