import { CameraButtons } from './CameraButtons';
import { CollectBadges } from './CollectBadges';
import { ConfirmPad } from './ConfirmPad';
import { ConfirmSaleDialog } from './ConfirmSaleDialog';
import { ExportReminder } from './ExportReminder';
import { ImportConfirmDialog } from './ImportConfirmDialog';
import { ReadOnlyBanner } from './ReadOnlyBanner';
import { RecoveryScreen } from './RecoveryScreen';
import { SaveFailedDialog } from './SaveFailedDialog';
import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { MarketPanel } from './MarketPanel';
import { MenuPanel } from './MenuPanel';
import { NextUnlock } from './NextUnlock';
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
      <NextUnlock />
      <Flyout />
      <SidePanel />
      <MarketPanel />
      <MenuPanel />
      <ConfirmPad />
      <ReadOnlyBanner />
      <ExportReminder />
      <ConfirmSaleDialog />
      <ImportConfirmDialog />
      <SaveFailedDialog />
      <RecoveryScreen />
      <Toast />
      <CameraButtons />
    </>
  );
}
