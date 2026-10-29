import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { SidePanel } from './SidePanel';

export function LayoutLeftMenu() {
  return (
    <>
      <Dock />
      <Flyout />
      <SidePanel />
    </>
  );
}
