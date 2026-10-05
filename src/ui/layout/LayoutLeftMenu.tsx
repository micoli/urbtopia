import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { SettingsPanel } from '../system/SettingsPanel';
import { SidePanel } from './SidePanel';

export function LayoutLeftMenu() {
  return (
    <>
      <Dock />
      <Flyout />
      <SidePanel />
      <SettingsPanel />
    </>
  );
}
