import { lazy } from 'react';
import { useStore } from 'zustand';
import { OnDemand } from './OnDemand';
import { casinoStore } from '../../store/casinoStore';
import { clubStore } from '../../store/clubStore';
import { showDialogStore } from '../../store/showDialogStore';
import { venueStore } from '../../store/venueStore';
import { useAdvisor } from '../advisor/useAdvisor';
import { BugReportWindow } from '../bugReport/BugReportWindow';
import { useDialogs } from '../common/hooks';
import { ChallengeSuccessOverlay } from '../market/ChallengeSuccessOverlay';
import { AdvisorDownloadConfirm } from '../advisor/AdvisorDownloadConfirm';
import { StaticButtons } from './StaticButtons.tsx';
import { FloatingBadges } from './FloatingBadges';
import { LocatorArrow } from '../buildings/LocatorArrow';
import { ConfirmPad } from '../build/ConfirmPad';
import { ConfirmSaleDialog } from '../build/ConfirmSaleDialog';
import { AnnualEventNotice } from '../system/AnnualEventNotice';
import { ExportReminder } from '../system/ExportReminder';
import { ReleaseNotes } from '../system/ReleaseNotes';
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
import { useUi } from '../common/hooks';
import { StreetViewDropHint } from './StreetViewDropHint';
import { AnalyticsHud } from '../analytics/AnalyticsHud';
import { AnalyticsReadout } from '../analytics/AnalyticsReadout';
import { PickDotMarker } from '../system/PickDotMarker';

const CityManagement = lazy(() => import('../stats/CityManagement').then((module) => ({ default: module.CityManagement })));
const SocialWindow = lazy(() => import('../social/SocialWindow').then((module) => ({ default: module.SocialWindow })));
const CodexDialog = lazy(() => import('../codex/CodexDialog').then((module) => ({ default: module.CodexDialog })));
const CasinoDialog = lazy(() => import('../casino/CasinoDialog').then((module) => ({ default: module.CasinoDialog })));
const ClubDialog = lazy(() => import('../club/ClubDialog').then((module) => ({ default: module.ClubDialog })));
const ShowDialog = lazy(() => import('../tourism/ShowDialog').then((module) => ({ default: module.ShowDialog })));
const VenueDialog = lazy(() => import('../venue/VenueDialog').then((module) => ({ default: module.VenueDialog })));
const MarketModal = lazy(() => import('../market/MarketModal').then((module) => ({ default: module.MarketModal })));
const AdvisorWindow = lazy(() => import('../advisor/AdvisorWindow').then((module) => ({ default: module.AdvisorWindow })));
const CreditsDialog = lazy(() => import('../system/CreditsDialog').then((module) => ({ default: module.CreditsDialog })));
const PoliticsWindow = lazy(() => import('../politics/PoliticsWindow').then((module) => ({ default: module.PoliticsWindow })));
const SettingsWindow = lazy(() => import('../system/SettingsWindow').then((module) => ({ default: module.SettingsWindow })));

export function Overlays() {
  const streetView = useUi((store) => store.streetView);
  const analytics = useUi((store) => store.analyticsLayer !== null);
  const underground = useUi((store) => store.level !== 0);
  const statsOpen = useUi((store) => store.statsOpen);
  const socialOpen = useUi((store) => store.socialOpen);
  const codexOpen = useUi((store) => store.codexOpen);
  const marketOpen = useUi((store) => store.marketOpen);
  const politicsOpen = useUi((store) => store.politicsOpen);
  const settingsOpen = useUi((store) => store.settingsOpen);
  const advisorOpen = useAdvisor((store) => store.windowOpen);
  const creditsOpen = useDialogs((store) => store.creditsOpen);
  const casinoOpen = useStore(casinoStore, (store) => store.casinoId !== null);
  const venueOpen = useStore(venueStore, (store) => store.venueId !== null);
  const clubOpen = useStore(clubStore, (store) => store.buildingId !== null);
  const showOpen = useStore(showDialogStore, (store) => store.buildingId !== null);
  return (
    <>
      <OnDemand when={statsOpen}><CityManagement /></OnDemand>
      <ServiceCoveragePanel />
      <BuildingSearchPanel />
      <OnDemand when={politicsOpen}><PoliticsWindow /></OnDemand>
      <OnDemand when={socialOpen}><SocialWindow /></OnDemand>
      <OnDemand when={codexOpen}><CodexDialog /></OnDemand>
      <OnDemand when={casinoOpen}><CasinoDialog /></OnDemand>
      <OnDemand when={venueOpen}><VenueDialog /></OnDemand>
      <OnDemand when={clubOpen}><ClubDialog /></OnDemand>
      <OnDemand when={showOpen}><ShowDialog /></OnDemand>
      <OnDemand when={marketOpen}><MarketModal /></OnDemand>
      <OnDemand when={settingsOpen}><SettingsWindow /></OnDemand>
      <OnDemand when={advisorOpen}><AdvisorWindow /></OnDemand>
      <BugReportWindow />
      <AdvisorDownloadConfirm />
      <ChallengeSuccessOverlay />
      {streetView || analytics || underground ? null : <FloatingBadges />}
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
      <OnDemand when={creditsOpen}><CreditsDialog /></OnDemand>
      <SaveFailedDialog />
      <SaveConflictOverlay />
      <SignInPrompt />
      <ReleaseNotes />
      <RecoveryScreen />
      <Toast />
      <TutorialBanner />
      {streetView ? null : <StaticButtons />}
      <StreetViewDropHint />
      <AnalyticsHud />
      <AnalyticsReadout />
      <PickDotMarker />
    </>
  );
}
