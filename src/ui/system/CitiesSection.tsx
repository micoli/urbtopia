import { useState } from 'react';
import { MAX_CITIES, readRegistry } from '../../persistence/cities';
import { openCityId, rawSaveStore } from '../../persistence/instance';
import { liveCityLifecycle } from '../../persistence/liveCityLifecycle';
import { t } from '../../i18n/t';
import { toastStore } from '../../store/toastStore';
import { CityRow } from './CityRow';
import { NewCityForm } from './NewCityForm';

export function CitiesSection() {
  const [registry, setRegistry] = useState(() => readRegistry(rawSaveStore));
  if (!registry) return null;
  const refresh = () => setRegistry(readRegistry(rawSaveStore));

  return (
    <section className="cities">
      <h3>{t('cities.title')}</h3>
      <ul className="cities-list">
        {registry.cities.map((city) => (
          <CityRow
            key={city.id}
            city={city}
            isOpen={city.id === openCityId()}
            isLast={registry.cities.length === 1}
            onOpen={() => liveCityLifecycle.open(city.id)}
            onRename={(name) => {
              const result = liveCityLifecycle.rename(city.id, name);
              refresh();
              return result;
            }}
            onDelete={async () => {
              const outcome = await liveCityLifecycle.remove(city.id);
              if (outcome.kind === 'deleted') {
                refresh();
                void outcome.cloudDeleted.then((deleted) => deleted || toastStore.getState().show('cities.cloudKept'));
              }
              return outcome;
            }}
          />
        ))}
      </ul>
      <NewCityForm full={registry.cities.length >= MAX_CITIES} onCreate={(difficulty) => liveCityLifecycle.create(difficulty)} />
    </section>
  );
}
