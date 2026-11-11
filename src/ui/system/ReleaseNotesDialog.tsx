import { t } from '../../i18n/t';
import type { Language } from '../../i18n/prefsStore';
import { formatReleaseDate } from '../../releaseNotes/formatReleaseDate';
import type { ReleaseNote } from '../../releaseNotes/releaseNote';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { Icon } from '../common/Icon';
import { InlineMarkdown } from './InlineMarkdown';

interface ReleaseNotesDialogProps {
  // Newest first.
  notes: readonly ReleaseNote[];
  index: number;
  language: Language;
  refreshing?: boolean;
  onSelect: (index: number) => void;
  onRefresh: () => void;
  onClose: () => void;
}

export function ReleaseNotesDialog({ notes, index, language, refreshing = false, onSelect, onRefresh, onClose }: ReleaseNotesDialogProps) {
  const note = notes[index];
  if (!note) return null;

  return (
    <Dialog className="release-notes-dialog">
      <Dialog.Title>{t('releaseNotes.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="release-notes-body">
          <p className="release-notes-meta">
            <u>
              <time dateTime={note.publishedAt}>{formatReleaseDate(note.publishedAt, language)}</time>
              {' · '}
              {t('releaseNotes.position').replace('{index}', String(notes.length - index)).replace('{total}', String(notes.length))}
            </u>
          </p>
          <h3><InlineMarkdown text={note.title[language]} /></h3>
          <ul>
            {note.items[language].map(item => <li key={item}><InlineMarkdown text={item} /></li>)}
          </ul>
        </div>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton size="sm" disabled={index >= notes.length - 1} aria-label={t('releaseNotes.older')} onClick={() => onSelect(index + 1)}><Icon name="arrowLeft" /></ActionButton>
        <ActionButton size="sm" disabled={index === 0} aria-label={t('releaseNotes.newer')} onClick={() => onSelect(index - 1)}><Icon name="arrowRight" /></ActionButton>
        <ActionButton size="sm" disabled={refreshing} onClick={onRefresh}><Icon name="rotateRight" /> {t('releaseNotes.refresh')}</ActionButton>
        <ActionButton variant="primary" onClick={onClose}>{t('panel.close')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
