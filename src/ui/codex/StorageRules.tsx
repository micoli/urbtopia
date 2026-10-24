import { FARM_CROP_CAPACITY, STORAGE_TYPES, storageCapacity, storageUsed, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { BuildLimitRow } from './BuildLimitRow';
import { StorageRulesRow } from './StorageRulesRow';

const LIMITED_TYPES = [...STORAGE_TYPES, 'farm', 'packhouse'] as const;

const COMPARTMENTS = [
  ['panel.materials', 'materials'],
  ['panel.crops', 'crops'],
  ['panel.goods', 'goods'],
] as const;

interface StorageRulesProps {
  state: GameState;
}

export function StorageRules({ state }: StorageRulesProps) {
  const used = storageUsed(state.storage);
  const capacity = storageCapacity(state);
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.storage.title')}</h3>
      <p>{t('codex.storage.intro')}</p>
      <ul>
        <li>{t('codex.storage.farm').replace('{capacity}', String(FARM_CROP_CAPACITY))}</li>
        <li>{t('codex.storage.floor')}</li>
        <li>{t('codex.storage.limit')}</li>
      </ul>
      <h4>{t('codex.storage.city')}</h4>
      <ul>
        {COMPARTMENTS.map(([label, compartment]) => (
          <li key={compartment}>{t(label)}: {used[compartment]}/{capacity[compartment]}</li>
        ))}
      </ul>
      <div className="codex-economy-scroll">
        <table className="codex-economy">
          <thead>
            <tr>
              <th scope="col">{t('codex.storage.building')}</th>
              <th scope="col">{t('codex.storage.perCopy')}</th>
            </tr>
          </thead>
          <tbody>
            {STORAGE_TYPES.map((type) => (
              <StorageRulesRow key={type} type={type} />
            ))}
          </tbody>
        </table>
      </div>
      <h4>{t('codex.storage.limits')}</h4>
      <div className="codex-economy-scroll">
        <table className="codex-economy">
          <thead>
            <tr>
              <th scope="col">{t('codex.storage.building')}</th>
              <th scope="col">{t('codex.storage.copies')}</th>
              <th scope="col">{t('codex.storage.nextUnlock')}</th>
              <th scope="col">{t('codex.storage.nextPrice')}</th>
            </tr>
          </thead>
          <tbody>
            {LIMITED_TYPES.map((type) => (
              <BuildLimitRow key={type} type={type} state={state} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
