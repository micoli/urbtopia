import { useState } from 'react';
import type { BuildingType } from '../../core';
import { demonstrationsOf } from '../../core/demonstrations/catalog';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';

export function DemonstrationsButton({ type }: { type: BuildingType }) {
  const [blocked, setBlocked] = useState(false);
  if (demonstrationsOf(type).length === 0) return null;
  const open = async () => {
    const { demonstrationStore } = await import('../../store/demonstrationStore');
    setBlocked(!demonstrationStore.getState().open(type));
  };
  return <>
    <ActionButton block onClick={() => void open()}><Icon name="movie" /> {t('demo.open')}</ActionButton>
    {blocked ? <p className="note" role="status">{t('demo.challenge')}</p> : null}
  </>;
}
