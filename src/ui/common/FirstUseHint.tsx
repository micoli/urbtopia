import { useStore } from 'zustand';
import { hintsStore, type HintId } from '../../store/hintsStore';
import { t } from '../../i18n/t';
import { ActionButton } from './ActionButton';

interface FirstUseHintProps {
  id: HintId;
  children: string;
}

export function FirstUseHint({ id, children }: FirstUseHintProps) {
  const seen = useStore(hintsStore, store => store.seen.includes(id));
  if (seen) return null;
  return (
    <aside className="first-use-hint" data-hint={id}>
      <p>{children}</p>
      <ActionButton onClick={() => hintsStore.getState().dismiss(id)}>{t('hint.dismiss')}</ActionButton>
    </aside>
  );
}
