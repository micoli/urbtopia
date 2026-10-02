import { CameraButtons } from './CameraButtons';
import { CollectBadges } from './CollectBadges';
import { ConfirmPad } from './ConfirmPad';
import { ConfirmSaleDialog } from './ConfirmSaleDialog';
import { ExportReminder } from './ExportReminder';
import { ImportConfirmDialog } from './ImportConfirmDialog';
import { ParcelTags } from './ParcelTags';
import { ReadOnlyBanner } from './ReadOnlyBanner';
import { RecoveryScreen } from './RecoveryScreen';
import { SaveFailedDialog } from './SaveFailedDialog';
import { Toast } from './Toast';

export function Overlays() {
  return (
    <>
      <CollectBadges />
      <ParcelTags />
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
