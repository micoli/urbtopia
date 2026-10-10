import { t } from '../../i18n/t';
import type { VenuePanelId } from '../../store/venueStore';
import type { NavAction } from '../layout/useNavActions';

// The main menu of the interior of a Venue, with the same buttons as the main menu of the city.
export function venueActionsOf(panel: VenuePanelId | null, toggle: (panel: VenuePanelId) => void, back: () => void): NavAction[] {
  const entry = (id: VenuePanelId, icon: string, label: string, image?: string): NavAction => ({
    id, icon, label, ...(image ? { image } : {}), pressed: panel === id, disabled: false, guided: false, onClick: () => toggle(id),
  });
  return [
    entry('build', '🏗', t('dock.build'), 'bulldozer.png'),
    entry('staff', '👥', t('venue.staff')),
    entry('events', '🏆', t('venue.events')),
    entry('takings', '💰', t('venue.takings'), 'market.png'),
    { id: 'back', icon: '↩', label: t('venue.menu.back'), pressed: false, disabled: false, guided: false, onClick: back },
  ];
}
