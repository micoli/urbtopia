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
import { LocatorArrow } from '../buildings/LocatorArrow';
import { ConfirmPad } from '../build/ConfirmPad';
import { ConfirmSaleDialog } from '../build/ConfirmSaleDialog';
import { AnnualEventNotice } from '../system/AnnualEventNotice';
import { ExportReminder } from '../system/ExportReminder';
import { BackOfficeBanner } from '../system/BackOfficeBanner';
import { ReadOnlyBanner } from '../system/ReadOnlyBanner';
import { VisitBanner } from '../system/VisitBanner';
import { HallOfFameNotice } from '../social/hall/HallOfFameNotice';
import { RecoveryScreen } from '../system/RecoveryScreen';
import { SaveConflictOverlay } from '../system/SaveConflictOverlay';
import { SignInPrompt } from '../system/SignInPrompt';
import { SaveFailedDialog } from '../system/SaveFailedDialog';
import { Toast } from '../system/Toast';
import { TutorialBanner } from '../tutorial/TutorialBanner';
import { UpdatePrompt } from '../system/UpdatePrompt';
import { ServiceCoveragePanel } from '../buildings/ServiceCoveragePanel';
import { BuildingSearchPanel } from '../buildings/BuildingSearchPanel';
import { PoliticsWindow } from '../politics/PoliticsWindow';
import { useUi } from '../common/hooks';
import { StreetViewDropHint } from './StreetViewDropHint';
import { AnalyticsHud } from '../analytics/AnalyticsHud';
import { AnalyticsReadout } from '../analytics/AnalyticsReadout';

export function Overlays() {
  const streetView = useUi((store) => store.streetView);
  const analytics = useUi((store) => store.analyticsLayer !== null);
  return (
    <>
      <CityManagement />
      <ServiceCoveragePanel />
      <BuildingSearchPanel />
      <PoliticsWindow />
      <SocialWindow />
      <CodexDialog />
      <CasinoDialog />
      <VenueDialog />
      <MarketModal />
      <ChallengeSuccessOverlay />
      {streetView || analytics ? null : <FloatingBadges />}
      {analytics ? <LocatorArrow /> : null}
      <ConfirmPad />
      <ReadOnlyBanner />
      <VisitBanner />
      <HallOfFameNotice />
      <BackOfficeBanner />
      <AnnualEventNotice />
      <ExportReminder />
      <UpdatePrompt />
      <ConfirmSaleDialog />
      <CreditsDialog />
      <SaveFailedDialog />
      <SaveConflictOverlay />
      <SignInPrompt />
      <RecoveryScreen />
      <Toast />
      <TutorialBanner />
      {streetView ? null : <StaticButtons />}
      <StreetViewDropHint />
      <AnalyticsHud />
      <AnalyticsReadout />
    </>
  );
}
