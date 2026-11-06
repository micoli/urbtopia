import { bugReportStore } from '../../bugReports/bugReportStore';
import type { ReportSnapshot } from '../../bugReports/liveReportSnapshot';
import { MAX_DESCRIPTION_LENGTH } from '../../bugReports/limits';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { CheckboxField } from '../common/CheckboxField';
import { Dialog } from '../common/Dialog';
import { Note } from '../common/Note';
import { BugReportImageChoice } from './BugReportImageChoice';
import { BugReportWhatIsSent } from './BugReportWhatIsSent';
import { useBugReportForm } from './useBugReportForm';

export function BugReportDialog({ snapshot }: { snapshot: ReportSnapshot }) {
  const close = () => bugReportStore.getState().closeForm();
  const form = useBugReportForm(snapshot, close);
  const failed = form.errorKey !== null;
  return (
    <Dialog className="bug-report-dialog">
      <Dialog.Title>{t('bugReport.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="bug-report-body">
          <label className="bug-report-field">
            <span className="setting-text__label">{t('bugReport.description.label')}</span>
            <textarea
              className="text-field bug-report-description"
              value={form.description}
              placeholder={t('bugReport.description.placeholder')}
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={5}
              autoFocus
              onChange={(event) => form.setDescription(event.target.value)}
            />
          </label>
          <BugReportImageChoice choice={form.image} onChange={form.setImage} map={snapshot.map} screen={snapshot.screen} />
          <CheckboxField label={t('bugReport.city')} checked={form.attachCity} disabled={form.cityTooLarge || !form.cityReady} onChange={form.setAttachCity} />
          {form.cityTooLarge ? <Note tone="muted">{t('bugReport.city.tooLarge')}</Note> : null}
          <BugReportWhatIsSent />
          {form.errorKey ? <Note>{t(form.errorKey)}</Note> : null}
        </div>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={close} disabled={form.sending}>{t('bugReport.cancel')}</ActionButton>
        <ActionButton variant="primary" onClick={() => void form.send()} disabled={!form.canSend || form.sending}>
          {form.sending ? t('bugReport.sending') : failed ? t('bugReport.retry') : t('bugReport.send')}
        </ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
