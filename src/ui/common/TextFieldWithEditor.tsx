import { useState } from 'react';
import { t } from '../../i18n/t';
import { ActionButton } from './ActionButton';
import { Dialog } from './Dialog';
import { TextField } from './TextField';

interface TextFieldWithEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

// A read-only TextField with a pencil: the text is only edited in a window, where OK keeps the draft and Cancel drops it.
export function TextFieldWithEditor({ label, value, onChange, onSubmit, placeholder, maxLength, className }: TextFieldWithEditorProps) {
  const [draft, setDraft] = useState<string>();
  const edit = () => setDraft(value);
  const close = () => setDraft(undefined);
  const confirm = () => {
    if (draft !== undefined) onChange(draft);
    close();
  };

  return (
    <div className="text-field-with-editor">
      <TextField readOnly label={label} value={value} onChange={onChange} onSubmit={onSubmit} onClick={edit} placeholder={placeholder} maxLength={maxLength} className={className} />
      <IconButton label={t('field.edit')} onClick={edit}>
        <Icon name="edit" />
      </IconButton>
      {draft !== undefined && (
        <Dialog onClose={close}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.Body>
            <TextField autoFocus label={label} value={draft} onChange={setDraft} onSubmit={confirm} placeholder={placeholder} maxLength={maxLength} />
          </Dialog.Body>
          <Dialog.Actions>
            <ActionButton onClick={close}>{t('field.cancel')}</ActionButton>
            <ActionButton variant="primary" onClick={confirm}>{t('field.ok')}</ActionButton>
          </Dialog.Actions>
        </Dialog>
      )}
    </div>
  );
}
