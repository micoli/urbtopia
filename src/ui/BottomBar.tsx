import { useNavActions } from './useNavActions';

export function BottomBar() {
  const actions = useNavActions();
  return (
    <nav className="bottom-bar">
      {actions.map((action) => (
        <button key={action.id} type="button" className="bottom-bar-button" aria-pressed={action.pressed} disabled={action.disabled} data-guided={action.guided} onClick={action.onClick}>
          <span aria-hidden="true">{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </nav>
  );
}
