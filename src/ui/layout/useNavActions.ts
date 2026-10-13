import { t } from '../../i18n/t';
import { cloudEnabled } from '../../persistence/cloud/cloudConfig';
import { pendingChallengesCount } from '../../challenges/pendingCount';
import { pendingSocialCount } from '../../social/pendingCount';
import { useChallenges, useGame, useSocial, useUi } from '../common/hooks';
import { useSanctionedHomes } from '../common/useSanctionedHomes';
import { guideOf } from '../tutorial/tutorialGuide';

export interface NavAction {
  id: string;
  icon: string;
  image?: string;
  label: string;
  pressed: boolean;
  disabled: boolean;
  guided: boolean;
  badge?: number;
  badgeLabel?: string;
  onClick: () => void;
}

export function useNavActions(): NavAction[] {
  const flyout = useUi((store) => store.flyout);
  const tool = useUi((store) => store.tool);
  const marketOpen = useUi((store) => store.marketOpen);
  const settingsOpen = useUi((store) => store.settingsOpen);
  const statsOpen = useUi(store => store.statsOpen);
  const toggleStats = useUi(store => store.toggleStats);
  const socialOpen = useUi(store => store.socialOpen);
  const toggleSocial = useUi(store => store.toggleSocial);
  const codexOpen = useUi(store => store.codexOpen);
  const openCodex = useUi(store => store.openCodex);
  const openFlyout = useUi((store) => store.openFlyout);
  const chooseTool = useUi((store) => store.chooseTool);
  const cancelTool = useUi((store) => store.cancelTool);
  const toggleMarket = useUi((store) => store.toggleMarket);
  const toggleSettings = useUi((store) => store.toggleSettings);
  const marketUnlocked = useGame((store) => store.state.marketUnlocked);
  const pendingRequests = useSocial(store => pendingSocialCount(store.profile, store.groups));
  const challengeState = useGame((store) => store.state);
  const challengeSnapshot = useChallenges((store) => store.snapshot);
  const seenChallenges = useChallenges((store) => store.seen);
  const newChallenges = marketUnlocked ? pendingChallengesCount(challengeState, challengeSnapshot, seenChallenges) : 0;
  const sanctionedCount = useSanctionedHomes().length;
  const guidedFlyout = guideOf(useGame((store) => store.state.tutorial)).flyout;

  return [
    { id: 'build', icon: '🏗', image: 'bulldozer.png', label: t('dock.build'), pressed: flyout === 'build', disabled: false, guided: guidedFlyout === 'build', onClick: () => openFlyout('build') },
    { id: 'roads', icon: '🛣', image: 'infrastructure-networks.png', label: t('dock.networks'), pressed: flyout === 'roads', disabled: false, guided: guidedFlyout === 'roads', onClick: () => openFlyout('roads') },
    { id: 'parcels', icon: '🗺', image: 'map.png', label: t('dock.parcels'), pressed: tool?.kind === 'parcel', disabled: false, guided: false, onClick: () => (tool?.kind === 'parcel' ? cancelTool() : chooseTool({ kind: 'parcel' })) },
    { id: 'market', icon: '💱', image: 'market.png', label: t('dock.market'), pressed: marketOpen, disabled: !marketUnlocked, guided: false, badge: newChallenges, badgeLabel: t('challenge.badge'), onClick: toggleMarket },
    { id: 'stats', icon: '📊', image: 'town-management.png', label: t('eco.title'), pressed: statsOpen, disabled: false, guided: false, badge: sanctionedCount, badgeLabel: t('sanction.alert'), onClick: toggleStats },
    ...(cloudEnabled ? [{ id: 'social', icon: '🌐', image: 'social-network.png', label: t('social.title'), pressed: socialOpen, disabled: false, guided: false, badge: pendingRequests, onClick: toggleSocial }] : []),
    { id: 'codex', icon: '📖', image: 'codex.png', label: t('codex.title'), pressed: codexOpen, disabled: false, guided: false, onClick: () => openCodex() },
    { id: 'settings', icon: '⚙', image: 'settings.png', label: t('dock.settings'), pressed: settingsOpen, disabled: false, guided: false, onClick: toggleSettings },
  ];
}
