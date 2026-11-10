import { useEffect, useRef } from 'react';
import { takeGroup } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { uiStore } from '../../store/uiStore';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import type { StashGroup } from './stashGroups';

interface StashGroupMenuProps {
  group: StashGroup;
  onClose: () => void;
}

// What a long press on a group offers: drop it for its price, or put it off to the bottom of the list.
export function StashGroupMenu({ group, onClose }: StashGroupMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const value = useGame((store) => (store.state.replan ? takeGroup(store.state.replan.stash, group.drop).value : 0));
  const isLater = group.section === 'replan.section.later';

  useEffect(() => {
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !ref.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [onClose]);

  const drop = () => {
    uiStore.getState().cancelTool();
    gameStore.getState().send({ type: 'Replan', action: { kind: 'drop', group: group.drop } });
    onClose();
  };
  const putOff = () => {
    gameStore.getState().send({ type: 'Replan', action: { kind: 'setLater', id: group.id, later: !isLater } });
    onClose();
  };

  return (
    <div ref={ref} className="stash-menu" role="menu" aria-label={t('replan.menu.label')}>
      <ActionButton size="sm" role="menuitem" onClick={drop}>{t('replan.menu.drop')} <UrbsAmount value={value} /></ActionButton>
      <ActionButton size="sm" role="menuitem" onClick={putOff}>{isLater ? t('replan.menu.back') : t('replan.menu.later')}</ActionButton>
    </div>
  );
}
