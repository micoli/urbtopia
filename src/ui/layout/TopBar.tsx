import type { ReactNode } from 'react';
import { CityStats } from '../stats/CityStats';
import { UrbsStat } from '../common/UrbsStat';

interface TopBarProps {
  children?: ReactNode;
}

export function TopBar({ children }: TopBarProps) {
  return (
    <header className="top-bar">
      {children ?? (
        <>
          <UrbsStat />
          <CityStats />
        </>
      )}
    </header>
  );
}
