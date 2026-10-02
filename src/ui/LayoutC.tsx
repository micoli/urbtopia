import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { MarketPanel } from './MarketPanel';
import { MenuPanel } from './MenuPanel';
import { NextUnlock } from './NextUnlock';
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
