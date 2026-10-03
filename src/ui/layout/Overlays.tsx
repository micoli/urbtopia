import { MaximalStats } from '../stats/MaximalStats';
import { CodexDialog } from '../codex/CodexDialog';
import { CameraButtons } from './CameraButtons';
import { CollectBadges } from '../collect/CollectBadges';
import { ConfirmPad } from '../build/ConfirmPad';
import { ConfirmSaleDialog } from '../build/ConfirmSaleDialog';
import { ExportReminder } from '../system/ExportReminder';
import { ImportConfirmDialog } from '../system/ImportConfirmDialog';
import { ParcelTags } from '../parcels/ParcelTags';
import { ReadOnlyBanner } from '../system/ReadOnlyBanner';
import { RecoveryScreen } from '../system/RecoveryScreen';
import { SaveFailedDialog } from '../system/SaveFailedDialog';
import { Toast } from '../system/Toast';
import { TutorialBanner } from '../tutorial/TutorialBanner';
import { UpdatePrompt } from '../system/UpdatePrompt';
import { WorkingIndicators } from '../buildings/WorkingIndicators';

export function Overlays() {
  return (
    <>
      <MaximalStats />
      <CodexDialog />
      <WorkingIndicators />
      <CollectBadges />
      <ParcelTags />
      <ConfirmPad />
      <ReadOnlyBanner />
      <ExportReminder />
      <UpdatePrompt />
      <ConfirmSaleDialog />
      <ImportConfirmDialog />
      <SaveFailedDialog />
      <RecoveryScreen />
      <Toast />
      <TutorialBanner />
      <CameraButtons />
    </>
  );
}
