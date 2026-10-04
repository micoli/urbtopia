import { useStore } from 'zustand';
import { prefsStore, type Language, type Layout } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { CheckboxField } from '../common/CheckboxField';
import { SectionHeading } from '../common/SectionHeading';

const LANGUAGES: Language[] = ['en', 'fr'];
const LAYOUTS: Layout[] = ['C', 'A', 'B'];

export function PreferencesContent() {
  const language = useStore(prefsStore, (store) => store.language);
  const layout = useStore(prefsStore, (store) => store.layout);
  const traffic = useStore(prefsStore, (store) => store.traffic);
  const confirmSale = useStore(prefsStore, (store) => store.confirmSale);
  const showReach = useStore(prefsStore, (store) => store.showReach);
  const { setLanguage, setLayout, setTraffic, setConfirmSale, setShowReach } = prefsStore.getState();

  return (
    <section className="prefs">
      <SectionHeading>{t('prefs.title')}</SectionHeading>
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
      <CheckboxField label={t('prefs.traffic')} checked={traffic} onChange={setTraffic} />
      <CheckboxField label={t('prefs.confirmSale')} checked={confirmSale} onChange={setConfirmSale} />
      <CheckboxField label={t('prefs.showReach')} checked={showReach} onChange={setShowReach} />
    </section>
  );
}
