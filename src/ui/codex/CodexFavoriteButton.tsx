import { useStore } from 'zustand';
import { favoriteKeyOf, type FavoriteTarget } from '../../codex/favorites';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { Icon } from '../common/Icon';

export function CodexFavoriteButton({ target }: { target: FavoriteTarget }) {
  const key = favoriteKeyOf(target);
  const favorite = useStore(prefsStore, store => store.codexFavorites.includes(key));
  const toggle = useStore(prefsStore, store => store.toggleCodexFavorite);
  const label = t(favorite ? 'codex.favorite.remove' : 'codex.favorite.add');
  return (
    <button type="button" className="codex-favorite" aria-pressed={favorite} aria-label={label} title={label} onClick={() => toggle(key)}>
      <Icon name="star" />
    </button>
  );
}
