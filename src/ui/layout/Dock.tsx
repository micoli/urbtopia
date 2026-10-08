import type { ReactNode } from 'react';
import { CityStats } from '../stats/CityStats';
import { NavActionButton } from './NavActionButton';
import { UrbsStat } from '../common/UrbsStat';
import { useNavActions, type NavAction } from './useNavActions';

interface DockProps {
  // The actions of the dock and what sits above them: the city by default.
  actions?: NavAction[];
  header?: ReactNode;
  // The action kept apart at the bottom of the dock.
  bottomId?: string;
}

export function Dock({ actions: provided, header, bottomId = 'settings' }: DockProps) {
  const cityActions = useNavActions();
  const actions = provided ?? cityActions;
  const bottomAction = actions.find((action) => action.id === bottomId);
  return (
    <nav className="dock">
      {header ?? (
        <>
          <UrbsStat />
          <CityStats />
        </>
      )}
      {actions
        .filter((action) => action.id !== bottomId)
        .map((action) => (
          <NavActionButton key={action.id} action={action} variant="dock" />
        ))}
      {bottomAction ? (
        <div className="dock__bottom">
          <NavActionButton action={bottomAction} variant="dock" />
        </div>
      ) : null}
    </nav>
  );
}
