import { NavActionButton } from './NavActionButton';
import { useNavActions } from './useNavActions';

export function BottomBar() {
  const actions = useNavActions();
  return (
    <nav className="bottom-bar">
      {actions.map((action) => (
        <NavActionButton key={action.id} action={action} variant="bar" />
      ))}
    </nav>
  );
}
