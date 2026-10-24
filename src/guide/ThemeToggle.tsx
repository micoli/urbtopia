import { t } from '../i18n/t';
import { currentTheme, setTheme } from './theme';

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="guide-icon-button"
      aria-label={t('guide.toggleTheme')}
      title={t('guide.toggleTheme')}
      onClick={() => setTheme(currentTheme() === 'dark' ? 'light' : 'dark')}
    >
      <svg className="size-5 dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className="hidden size-5 dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
