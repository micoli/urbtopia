import { CityStats } from '../stats/CityStats';
import { NavActionButton } from './NavActionButton';
import { UrbsStat } from '../common/UrbsStat';
import { useNavActions } from './useNavActions';

export function Dock() {
  const actions = useNavActions();
  const settingsAction = actions.find((action) => action.id === 'settings');
  return (
    <nav className="dock">
      <UrbsStat />
      <CityStats />
      {actions
        .filter((action) => action.id !== 'settings')
        .map((action) => (
          <NavActionButton key={action.id} action={action} variant="dock" />
        ))}
      {settingsAction ? (
        <div className="dock__bottom">
          <NavActionButton action={settingsAction} variant="dock" />
        </div>
      ) : null}
    </nav>
  );
}
