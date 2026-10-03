import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { MarketPanel } from '../market/MarketPanel';
import { MenuPanel } from '../system/MenuPanel';
import { NextUnlock } from '../stats/NextUnlock';
import { SidePanel } from './SidePanel';

export function LayoutC() {
  return (
    <>
      <Dock />
      <NextUnlock />
      <Flyout />
      <SidePanel />
      <MarketPanel />
      <MenuPanel />
    </>
  );
}
