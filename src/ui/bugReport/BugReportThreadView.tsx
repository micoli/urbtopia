import { useState } from 'react';
import { bugReportInboxStore } from '../../bugReports/bugReportInboxStore';
import { MAX_REPLY_LENGTH } from '../../bugReports/limits';
import type { BugReportThread } from '../../bugReports/types';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { TextField } from '../common/TextField';
import { bugReportErrorKey } from './bugReportErrorKey';
import { BugReportStatusLabel } from './BugReportStatusLabel';
import { useBugReportInbox } from './useBugReportInbox';

export function BugReportThreadView({ thread }: { thread: BugReportThread }) {
  const [text, setText] = useState('');
  const busy = useBugReportInbox((store) => store.busy);
  const failed = useBugReportInbox((store) => store.failed);
  const closed = thread.status === 'resolved';
  const send = async () => {
    if (text.trim() === '' || busy) return;
    if (await bugReportInboxStore.getState().reply(text)) setText('');
  };
  return (
    <div className="bug-report-thread">
      <p className="bug-report-thread__description">{thread.description}</p>
      <BugReportStatusLabel status={thread.status} />
      <ul className="bug-report-thread__replies">
        {thread.replies.map((reply) => (
          <li key={reply.id} className={reply.fromAdmin ? 'bug-report-reply bug-report-reply--team' : 'bug-report-reply bug-report-reply--mine'}>
            <small>{reply.fromAdmin ? t('bugReport.thread.team') : t('bugReport.thread.you')}</small>
            <span>{reply.body}</span>
          </li>
        ))}
      </ul>
      {failed ? <Note>{t(bugReportErrorKey(failed))}</Note> : null}
      {closed ? (
        <Note tone="muted">{t('bugReport.reply.closed')}</Note>
      ) : (
        <div className="bug-report-thread__compose">
          <TextField label={t('bugReport.reply.placeholder')} placeholder={t('bugReport.reply.placeholder')} value={text} onChange={setText} onSubmit={() => void send()} maxLength={MAX_REPLY_LENGTH} />
          <ActionButton variant="primary" disabled={busy || text.trim() === ''} onClick={() => void send()}>{t('bugReport.reply.send')}</ActionButton>
        </div>
      )}
    </div>
  );
}
