import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { MarketPanel } from '../market/MarketPanel';
import { MenuPanel } from '../system/MenuPanel';
import { SidePanel } from './SidePanel';

export function LayoutLeftMenu() {
  return (
    <>
      <Dock />
      <Flyout />
      <SidePanel />
      <MarketPanel />
      <MenuPanel />
    </>
  );
}
