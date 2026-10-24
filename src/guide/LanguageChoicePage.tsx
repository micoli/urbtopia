import { GUIDE_LANGUAGES } from './routes';

const LANGUAGE_NAMES = { en: 'English', fr: 'Français' } as const;

export function LanguageChoicePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface p-4 text-ink">
      <h1 className="text-2xl font-semibold tracking-tight">Urbtopia Guide</h1>
      <ul className="flex gap-3">
        {GUIDE_LANGUAGES.map(language => <li key={language}><a className="guide-chip" href={`${language}/`} lang={language}>{LANGUAGE_NAMES[language]}</a></li>)}
      </ul>
    </main>
  );
}
