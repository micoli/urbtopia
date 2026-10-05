import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { MenuPanel } from '../system/MenuPanel';
import { SidePanel } from './SidePanel';

export function LayoutLeftMenu() {
  return (
    <>
      <Dock />
      <Flyout />
      <SidePanel />
      <MenuPanel />
    </>
  );
}
