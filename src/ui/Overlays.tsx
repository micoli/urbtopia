import { MaximalStats } from './MaximalStats';
import { CodexDialog } from './CodexDialog';
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
import { TutorialBanner } from './TutorialBanner';
import { UpdatePrompt } from './UpdatePrompt';
import { WorkingIndicators } from './WorkingIndicators';

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
