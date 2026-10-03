import { SERVICE_CATEGORIES, categoryCoverageRatio, homesLackingRequiredServices, missingServices, serviceCoverage, type GameState, type ServiceKey } from '../../core';
import { t } from '../../i18n/t';
import { serviceName } from './serviceNames';

interface ServicesSectionProps {
  state: GameState;
}

export function ServicesSection({ state }: ServicesSectionProps) {
  const coverage = serviceCoverage(state);
  const lacking = [...new Set<ServiceKey>(homesLackingRequiredServices(state).flatMap(home => missingServices(coverage, home)))];
  return (
    <section id="eco-services">
      <h3><span aria-hidden="true">✚</span> {t('stats.services')}</h3>
      <dl>
        {SERVICE_CATEGORIES.map(category => (
          <div key={category}><dt>{t(`service.${category}`)}</dt><dd>{(100 * categoryCoverageRatio(state, category)).toFixed(0)} %</dd></div>
        ))}
      </dl>
      <p>{t('stats.servicesHelp')}</p>
      {lacking.length > 0 && <p>{t('stats.servicesSuggest')} {lacking.map(serviceName).join(', ')}</p>}
    </section>
  );
}
