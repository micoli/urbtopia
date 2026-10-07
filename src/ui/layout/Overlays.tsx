import { CityManagement } from '../stats/CityManagement.tsx';
import { CreditsDialog } from '../system/CreditsDialog';
import { CodexDialog } from '../codex/CodexDialog';
import { CasinoDialog } from '../casino/CasinoDialog';
import { MarketModal } from '../market/MarketModal';
import { StaticButtons } from './StaticButtons.tsx';
import { CollectBadges } from '../collect/CollectBadges';
import { ConfirmPad } from '../build/ConfirmPad';
import { ConfirmSaleDialog } from '../build/ConfirmSaleDialog';
import { ExportReminder } from '../system/ExportReminder';
import { ImportConfirmDialog } from '../system/ImportConfirmDialog';
import { ParcelTags } from '../parcels/ParcelTags';
import { ReadOnlyBanner } from '../system/ReadOnlyBanner';
import { RecoveryScreen } from '../system/RecoveryScreen';
import { SaveConflictOverlay } from '../system/SaveConflictOverlay';
import { SaveFailedDialog } from '../system/SaveFailedDialog';
import { Toast } from '../system/Toast';
import { TutorialBanner } from '../tutorial/TutorialBanner';
import { UpdatePrompt } from '../system/UpdatePrompt';
import { WorkingIndicators } from '../common/WorkingIndicators.tsx';

export function Overlays() {
  return (
    <>
      <CityManagement />
      <CodexDialog />
      <CasinoDialog />
      <MarketModal />
      <WorkingIndicators />
      <CollectBadges />
      <ParcelTags />
      <ConfirmPad />
      <ReadOnlyBanner />
      <ExportReminder />
      <UpdatePrompt />
      <ConfirmSaleDialog />
      <ImportConfirmDialog />
      <CreditsDialog />
      <SaveFailedDialog />
      <SaveConflictOverlay />
      <RecoveryScreen />
      <Toast />
      <TutorialBanner />
      <StaticButtons />
    </>
  );
}
