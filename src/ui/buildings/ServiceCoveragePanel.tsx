import { useStore } from 'zustand';
import { FACILITY_TYPES, FACILITIES, SERVICE_CATEGORIES } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';
import { Dropdown } from '../common/Dropdown';
import { useUi } from '../common/hooks';
import { serviceName } from './serviceNames';

export function ServiceCoveragePanel() {
  const open = useUi(store => store.serviceCoverageOpen);
  const close = useUi(store => store.closeServiceCoverage);
  const type = useStore(prefsStore, store => store.serviceCoverageType);
  const setType = useStore(prefsStore, store => store.setServiceCoverageType);
  if (!open) return null;

  const options = SERVICE_CATEGORIES.flatMap(category => FACILITY_TYPES
    .filter(type => FACILITIES[type].category === category)
    .map(type => ({ value: type, label: serviceName(type), group: t(`service.${category}`) })));

  return (
    <section className="service-coverage-panel" aria-labelledby="service-coverage-heading">
      <header>
        <h2 id="service-coverage-heading">{t('coverage.title')}</h2>
        <CloseButton onClick={close} label={t('coverage.close')} />
      </header>
      <Dropdown label={t('coverage.type')} options={options} value={type} onChange={setType} className="dropdown--fill" />
      <ul className="service-coverage-legend">
        <li><span className="service-coverage-swatch service-coverage-swatch--covered" aria-hidden="true" />{t('coverage.covered')}</li>
        <li><span className="service-coverage-swatch service-coverage-swatch--uncovered" aria-hidden="true" />{t('coverage.uncovered')}</li>
        <li><span className="service-coverage-swatch service-coverage-swatch--facility" aria-hidden="true" />{t('coverage.facilities')}</li>
      </ul>
    </section>
  );
}
