import { t } from '../../i18n/t';

export function BugReportWhatIsSent() {
  return (
    <div className="bug-report-sent">
      <small className="setting-text__label">{t('bugReport.sent.title')}</small>
      <ul>
        <li>{t('bugReport.sent.context')}</li>
        <li>{t('bugReport.sent.camera')}</li>
      </ul>
    </div>
  );
}
