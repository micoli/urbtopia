import { useStore } from 'zustand';
import { prefsStore, type Language, type Layout } from '../i18n/prefsStore';
import { t } from '../i18n/t';

const LANGUAGES: Language[] = ['en', 'fr'];
const LAYOUTS: Layout[] = ['C', 'A', 'B'];

export function PreferencesContent() {
  const language = useStore(prefsStore, (store) => store.language);
  const layout = useStore(prefsStore, (store) => store.layout);
  const traffic = useStore(prefsStore, (store) => store.traffic);
  const { setLanguage, setLayout, setTraffic } = prefsStore.getState();

  return (
    <section className="prefs">
      <h3>{t('prefs.title')}</h3>
      <div className="prefs-group" role="radiogroup" aria-label={t('prefs.language')}>
        {LANGUAGES.map((code) => (
          <button key={code} type="button" role="radio" aria-checked={language === code} onClick={() => setLanguage(code)}>
            {t(`lang.${code}`)}
          </button>
        ))}
      </div>
      <div className="prefs-group" role="radiogroup" aria-label={t('prefs.layout')}>
        {LAYOUTS.map((code) => (
          <button key={code} type="button" role="radio" aria-checked={layout === code} onClick={() => setLayout(code)}>
            {t(`prefs.layout.${code}`)}
          </button>
        ))}
      </div>
      <label className="prefs-toggle">
        <input type="checkbox" checked={traffic} onChange={(event) => setTraffic(event.target.checked)} />
        {t('prefs.traffic')}
      </label>
    </section>
  );
}
