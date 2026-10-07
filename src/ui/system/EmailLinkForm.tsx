import { useState } from 'react';
import { t } from '../../i18n/t';
import type { EmailLinkState } from '../../store/cloudStore';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { emailLinkMessageKey } from './emailLinkMessage';

interface EmailLinkFormProps {
  state: EmailLinkState;
  onSend: (email: string) => void;
}

export function EmailLinkForm({ state, onSend }: EmailLinkFormProps) {
  const [email, setEmail] = useState('');
  const messageKey = emailLinkMessageKey(state);
  const sending = state.kind === 'sending';

  return (
    <form
      className="cloud-email"
      onSubmit={(event) => {
        event.preventDefault();
        onSend(email);
      }}
    >
      <p className="note note--muted">{t('cloud.account.anonymous')}</p>
      <input type="email" autoComplete="email" aria-label={t('cloud.account.email')} placeholder={t('cloud.account.email')} value={email} onChange={(event) => setEmail(event.target.value)} />
      <ActionButton type="submit" variant="primary" disabled={sending}>
        {sending ? t('cloud.account.sending') : t('cloud.account.sendLink')}
      </ActionButton>
      {messageKey ? <Note tone={state.kind === 'sent' ? 'muted' : 'warn'}>{t(messageKey)}</Note> : null}
    </form>
  );
}
