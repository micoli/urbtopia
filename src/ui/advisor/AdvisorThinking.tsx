import { t } from '../../i18n/t';

export function AdvisorThinking() {
  return (
    <p className="advisor-thinking" role="status">
      <span className="advisor-thinking__dots" aria-hidden="true"><span /><span /><span /></span>
      {t('advisor.thinking')}
    </p>
  );
}
