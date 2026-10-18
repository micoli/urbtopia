import { CityManagement } from '../stats/CityManagement.tsx';
import { SocialWindow } from '../social/SocialWindow';
import { CreditsDialog } from '../system/CreditsDialog';
import { CodexDialog } from '../codex/CodexDialog';
import { CasinoDialog } from '../casino/CasinoDialog';
import { VenueDialog } from '../venue/VenueDialog';
import { MarketModal } from '../market/MarketModal';
import { ChallengeSuccessOverlay } from '../market/ChallengeSuccessOverlay';
import { StaticButtons } from './StaticButtons.tsx';
import { FloatingBadges } from './FloatingBadges';
import { ConfirmPad } from '../build/ConfirmPad';
import { ConfirmSaleDialog } from '../build/ConfirmSaleDialog';
import { ExportReminder } from '../system/ExportReminder';
import { ImportConfirmDialog } from '../system/ImportConfirmDialog';
import { BackOfficeBanner } from '../system/BackOfficeBanner';
import { ReadOnlyBanner } from '../system/ReadOnlyBanner';
import { RecoveryScreen } from '../system/RecoveryScreen';
import { SaveConflictOverlay } from '../system/SaveConflictOverlay';
import { SaveFailedDialog } from '../system/SaveFailedDialog';
import { Toast } from '../system/Toast';
import { TutorialBanner } from '../tutorial/TutorialBanner';
import { UpdatePrompt } from '../system/UpdatePrompt';
import { ServiceCoveragePanel } from '../buildings/ServiceCoveragePanel';

export function Overlays() {
  return (
    <>
      <CityManagement />
      <ServiceCoveragePanel />
      <SocialWindow />
      <CodexDialog />
      <CasinoDialog />
      <VenueDialog />
      <MarketModal />
      <ChallengeSuccessOverlay />
      <FloatingBadges />
      <ConfirmPad />
      <ReadOnlyBanner />
      <BackOfficeBanner />
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
