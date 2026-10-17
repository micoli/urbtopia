import { SERVICE_CATEGORIES, categoryCoverageRatio, homesLackingRequiredServices, missingServices, serviceCoverage, type GameState, type ServiceKey } from '../../core';
import { t } from '../../i18n/t';
import { serviceName } from './serviceNames';
import { SectionHeading } from '../common/SectionHeading';
import { LabeledList } from '../common/LabeledList';
import { ActionButton } from '../common/ActionButton';
import { useUi } from '../common/hooks';

interface ServicesSectionProps {
  state: GameState;
}

export function ServicesSection({ state }: ServicesSectionProps) {
  const openCoverage = useUi(store => store.openServiceCoverage);
  const coverage = serviceCoverage(state);
  const lacking = [...new Set<ServiceKey>(homesLackingRequiredServices(state).flatMap(home => missingServices(coverage, home)))];
  return (
    <section id="eco-services">
      <SectionHeading icon="✚">{t('stats.services')}</SectionHeading>
      <LabeledList>
        {SERVICE_CATEGORIES.map(category => (
          <LabeledList.Row key={category} label={t(`service.${category}`)}>{(100 * categoryCoverageRatio(state, category)).toFixed(0)} %</LabeledList.Row>
        ))}
      </LabeledList>
      <p>{t('stats.servicesHelp')}</p>
      <ActionButton onClick={openCoverage}>{t('coverage.open')}</ActionButton>
      {lacking.length > 0 && <p>{t('stats.servicesSuggest')} {lacking.map(serviceName).join(', ')}</p>}
    </section>
  );
}
