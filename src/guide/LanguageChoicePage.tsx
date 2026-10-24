import { GUIDE_LANGUAGES } from './routes';

const LANGUAGE_NAMES = { en: 'English', fr: 'Français' } as const;

export function LanguageChoicePage() {
  return (
    <main className="guide-page">
      <h1>Urbtopia Guide</h1>
      <ul className="guide-links">
        {GUIDE_LANGUAGES.map(language => <li key={language}><a href={`${language}/`} lang={language}>{LANGUAGE_NAMES[language]}</a></li>)}
      </ul>
    </main>
  );
}
