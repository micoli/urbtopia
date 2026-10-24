import { t } from '../../i18n/t';

interface SearchButtonProps {
  onOpen: () => void;
}

export function SearchButton({ onOpen }: SearchButtonProps) {
  return (
    <button type="button" className="guide-chip inline-flex cursor-pointer items-center gap-2 text-muted" aria-label={t('guide.search')} aria-keyshortcuts="Meta+K Control+K" onClick={onOpen}>
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="hidden sm:inline">{t('guide.search')}</span>
      <kbd className="hidden rounded border border-line px-1 font-sans text-xs sm:inline">⌘K</kbd>
    </button>
  );
}
