import { favoriteKeyOf, type FavoriteTarget } from '../../codex/favorites';
import { AccordionSection } from '../common/AccordionSection';
import { t } from '../../i18n/t';

interface CodexFavoritesNavProps {
  idPrefix: string;
  favorites: readonly { target: FavoriteTarget; label: string; current: boolean }[];
  expanded: boolean;
  onToggle: () => void;
  onChoose: (target: FavoriteTarget) => void;
}

export function CodexFavoritesNav({ idPrefix, favorites, expanded, onToggle, onChoose }: CodexFavoritesNavProps) {
  if (favorites.length === 0) return null;
  return (
    <AccordionSection id={`${idPrefix}-favorites`} title={t('codex.favorites')} expanded={expanded} chevron toggleClassName="codex-section-toggle" onToggle={onToggle}>
      {favorites.map(({ target, label, current }) => (
        <button key={favoriteKeyOf(target)} type="button" aria-current={current ? 'true' : undefined} onClick={() => onChoose(target)}>{label}</button>
      ))}
    </AccordionSection>
  );
}
