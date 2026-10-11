import { useState } from 'react';
import { t } from '../../i18n/t';
import type { EmailCodeActions, EmailCodeState } from '../../store/cloudStore';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { emailCodeMessageKey } from './emailCodeMessage';

interface EmailCodeFormProps {
  state: EmailCodeState;
  actions: EmailCodeActions;
}

export function EmailCodeForm({ state, actions }: EmailCodeFormProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const messageKey = emailCodeMessageKey(state);

  if (state.kind === 'sent' || state.kind === 'verifying') {
    const verifying = state.kind === 'verifying';
    return (
      <form
        className="cloud-email"
        onSubmit={(event) => {
          event.preventDefault();
          actions.verify(code);
        }}
      >
        <p className="note note--muted">{t('cloud.account.codeSent').replace('{E}', state.email)}</p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          aria-label={t('cloud.account.code')}
          placeholder={t('cloud.account.code')}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <ActionButton type="submit" variant="primary" disabled={verifying}>
          {verifying ? t('cloud.account.verifying') : t('cloud.account.verify')}
        </ActionButton>
        {messageKey ? <Note>{t(messageKey)}</Note> : null}
        <ActionButton disabled={verifying} onClick={() => actions.send(state.email)}>
          {t('cloud.account.resend')}
        </ActionButton>
        <ActionButton disabled={verifying} onClick={actions.cancel}>
          {t('cloud.account.changeEmail')}
        </ActionButton>
      </form>
    );
  }

  const sending = state.kind === 'sending';
  return (
    <form
      className="cloud-email"
      onSubmit={(event) => {
        event.preventDefault();
        actions.send(email);
      }}
    >
      <p className="note note--muted">{t('cloud.account.anonymous')}</p>
      <input type="email" autoComplete="email" aria-label={t('cloud.account.email')} placeholder={t('cloud.account.email')} value={email} onChange={(event) => setEmail(event.target.value)} />
      <ActionButton type="submit" variant="primary" disabled={sending}>
        {sending ? t('cloud.account.sending') : t('cloud.account.sendCode')}
      </ActionButton>
      {messageKey ? <Note>{t(messageKey)}</Note> : null}
    </form>
  );
}
