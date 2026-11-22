import { visibleCategories } from '../../core';
import { useAvailableFeatures } from '../../achievements/availableFeatures';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';
import { Note } from '../common/Note';
import { useGame, useUi } from '../common/hooks';
import { useBackdropClose } from '../common/useBackdropClose';
import { useModalFocus } from '../stats/management/useModalFocus';
import { CategorySection } from './CategorySection';

function AchievementsDialog() {
  const state = useGame((store) => store.state);
  const flags = useAvailableFeatures();
  const open = useUi((store) => store.achievementsOpen);
  const close = useUi((store) => store.closeAchievements);
  const panel = useModalFocus(open, close);
  const backdrop = useBackdropClose(close);
  if (!open) return null;
  const categories = visibleCategories(state, flags);
  return (
    <div className="dialog-backdrop window-backdrop city-management-backdrop" {...backdrop}>
      <div className="eco-dashboard achievements-window" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="achievements-heading">
        <header className="eco-header">
          <h2 id="achievements-heading">{t('achievements.title')}</h2>
          <CloseButton onClick={close} />
        </header>
        {categories.length === 0
          ? <Note tone="muted">{t('achievements.empty')}</Note>
          : <div className="eco-sections">{categories.map((progress) => <CategorySection key={progress.category} state={state} flags={flags} progress={progress} />)}</div>}
      </div>
    </div>
  );
}

export function AchievementsWindow() {
  const open = useUi((store) => store.achievementsOpen);
  return open ? <AchievementsDialog /> : null;
}
