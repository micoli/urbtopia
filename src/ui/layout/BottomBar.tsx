import { NavActionButton } from './NavActionButton';
import { useNavActions, type NavAction } from './useNavActions';

interface BottomBarProps {
  actions?: NavAction[];
}

export function BottomBar({ actions: provided }: BottomBarProps) {
  const cityActions = useNavActions();
  const actions = provided ?? cityActions;
  return (
    <nav className="bottom-bar">
      {actions.map((action) => (
        <NavActionButton key={action.id} action={action} variant="bar" />
      ))}
    </nav>
  );
}
