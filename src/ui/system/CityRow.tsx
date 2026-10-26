import type { CityEntry } from '../../persistence/cities';
import type { RenameResult } from '../../persistence/cityActions';
import type { DeleteOutcome } from '../../persistence/cityLifecycle';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { DeleteCityButton } from './DeleteCityButton';
import { RenameCityForm } from './RenameCityForm';

interface CityRowProps {
  city: CityEntry;
  isOpen: boolean;
  isLast: boolean;
  onOpen: () => void;
  onRename: (name: string) => RenameResult;
  onDelete: () => Promise<DeleteOutcome>;
}

export function CityRow({ city, isOpen, isLast, onOpen, onRename, onDelete }: CityRowProps) {
  const name = city.name ?? '';
  return (
    <li className="city-row" aria-current={isOpen ? 'true' : undefined}>
      <strong>{name}</strong>
      {isOpen ? <small>{t('cities.current')}</small> : <ActionButton onClick={onOpen}>{t('cities.open')}</ActionButton>}
      <RenameCityForm key={name} name={name} onRename={onRename} />
      <DeleteCityButton cityName={name} isLast={isLast} onDelete={onDelete} />
    </li>
  );
}
