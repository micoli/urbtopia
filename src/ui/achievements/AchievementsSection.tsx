import { visibleCategories } from '../../core';
import { useAvailableFeatures } from '../../achievements/availableFeatures';
import { t } from '../../i18n/t';
import { Note } from '../common/Note';
import { useGame } from '../common/hooks';
import { CategorySection } from './CategorySection';

// The Achievements tab of the City management window.
export function AchievementsSection() {
  const state = useGame((store) => store.state);
  const flags = useAvailableFeatures();
  const categories = visibleCategories(state, flags);
  if (categories.length === 0) return <Note tone="muted">{t('achievements.empty')}</Note>;
  return <div className="eco-sections achievements-window">{categories.map((progress) => <CategorySection key={progress.category} state={state} flags={flags} progress={progress} />)}</div>;
}
