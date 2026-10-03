import { CityStats } from './CityStats';
import { UrbsStat } from './UrbsStat';
import { useNavActions } from './useNavActions';

export function Dock() {
  const actions = useNavActions();
  return (
    <nav className="dock">
      <UrbsStat />
      <CityStats />
      {actions.map((action) => (
        <button key={action.id} type="button" className="dock-button" aria-pressed={action.pressed} disabled={action.disabled} data-guided={action.guided} onClick={action.onClick}>
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
    </nav>
  );
}
