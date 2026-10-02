import { CameraButtons } from './CameraButtons';
import { CollectBadges } from './CollectBadges';
import { ConfirmPad } from './ConfirmPad';
import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { MarketPanel } from './MarketPanel';
import { SceneCanvas } from './SceneCanvas';
import { SidePanel } from './SidePanel';
import { Toast } from './Toast';

export function App() {
  return (
    <>
      <SceneCanvas />
      <CollectBadges />
      <Dock />
      <Flyout />
      <SidePanel />
      <MarketPanel />
      <ConfirmPad />
      <Toast />
      <CameraButtons />
    </>
  );
}
