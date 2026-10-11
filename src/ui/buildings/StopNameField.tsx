import { useEffect, useState } from 'react';
import { STOP_NAME_MAX_LENGTH, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';

export function StopNameField({ building }: { building: Building }) {
  const [draft, setDraft] = useState(building.name ?? '');
  useEffect(() => setDraft(building.name ?? ''), [building.id, building.name]);
  const commit = () => {
    if (draft.trim() === (building.name ?? '')) return;
    gameStore.getState().send({ type: 'RenameStop', buildingId: building.id, name: draft });
  };
  return <label className="stop-name-field">
    <span>{t('transit.stopName')}</span>
    <input
      type="text"
      value={draft}
      maxLength={STOP_NAME_MAX_LENGTH}
      placeholder={t(`building.${building.type}`)}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()}
    />
  </label>;
}
