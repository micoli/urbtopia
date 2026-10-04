import { CityStats } from '../stats/CityStats';
import { NavActionButton } from './NavActionButton';
import { UrbsStat } from '../common/UrbsStat';
import { useNavActions } from './useNavActions';

export function Dock() {
  const actions = useNavActions();
  return (
    <nav className="dock">
      <UrbsStat />
      <CityStats />
      {actions.map((action) => (
        <NavActionButton key={action.id} action={action} variant="dock" />
      ))}
    </nav>
  );
}
