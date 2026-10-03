import { CityStats } from './CityStats';
import { NavIcon } from './NavIcon';
import { UrbsStat } from './UrbsStat';
import { useNavActions } from './useNavActions';

export function Dock() {
  const actions = useNavActions();
  return (
    <nav className="dock">
      <UrbsStat />
      <CityStats />
      {actions.map((action) => (
        <button key={action.id} data-action={action.id} type="button" className="dock-button" aria-label={action.label} aria-pressed={action.pressed} disabled={action.disabled} data-guided={action.guided} onClick={action.onClick}>
          <NavIcon action={action} />
          <span>{action.label}</span>
        </button>
      ))}
    </nav>
  );
}
