import { CityStats } from '../stats/CityStats';
import { NavActionButton } from './NavActionButton';
import { UrbsStat } from '../common/UrbsStat';
import { useNavActions } from './useNavActions';

export function Dock() {
  const actions = useNavActions();
  const menuAction = actions.find((action) => action.id === 'menu');
  return (
    <nav className="dock">
      <UrbsStat />
      <CityStats />
      {actions
        .filter((action) => action.id !== 'menu')
        .map((action) => (
          <NavActionButton key={action.id} action={action} variant="dock" />
        ))}
      {menuAction ? (
        <div className="dock__bottom">
          <NavActionButton action={menuAction} variant="dock" />
        </div>
      ) : null}
    </nav>
  );
}
