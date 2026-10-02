import { CameraButtons } from './CameraButtons';
import { CollectBadges } from './CollectBadges';
import { ConfirmPad } from './ConfirmPad';
import { ConfirmSaleDialog } from './ConfirmSaleDialog';
import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { MarketPanel } from './MarketPanel';
import { ParcelTags } from './ParcelTags';
import { SceneCanvas } from './SceneCanvas';
import { SidePanel } from './SidePanel';
import { Toast } from './Toast';

export function App() {
  return (
    <>
      <SceneCanvas />
      <CollectBadges />
      <ParcelTags />
      <Dock />
      <Flyout />
      <SidePanel />
      <MarketPanel />
      <ConfirmPad />
      <ConfirmSaleDialog />
      <Toast />
      <CameraButtons />
    </>
  );
}
