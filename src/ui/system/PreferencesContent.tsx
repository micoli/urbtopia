import { useStore } from 'zustand';
import { prefsStore, type Language, type Layout } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { CheckboxField } from '../common/CheckboxField';
import { SectionHeading } from '../common/SectionHeading';
import { RadioChipGroup } from '../common/RadioChipGroup';

const LANGUAGES: Language[] = ['en', 'fr'];
const LAYOUTS: Layout[] = ['C', 'A', 'B'];

export function PreferencesContent() {
  const language = useStore(prefsStore, (store) => store.language);
  const layout = useStore(prefsStore, (store) => store.layout);
  const traffic = useStore(prefsStore, (store) => store.traffic);
  const confirmSale = useStore(prefsStore, (store) => store.confirmSale);
  const showReach = useStore(prefsStore, (store) => store.showReach);
  const showProductionPreview = useStore(prefsStore, (store) => store.showProductionPreview);
  const showTaxBadges = useStore(prefsStore, (store) => store.showTaxBadges);
  const debug = useStore(prefsStore, (store) => store.debug);
  const alwaysDay = useStore(prefsStore, (store) => store.alwaysDay);
  const { setAlwaysDay, setDebug, setLanguage, setLayout, setTraffic, setConfirmSale, setShowReach, setShowProductionPreview, setShowTaxBadges } = prefsStore.getState();

  return (
    <section className="prefs">
      <SectionHeading>{t('prefs.title')}</SectionHeading>
      <RadioChipGroup className="prefs-group" label={t('prefs.language')} options={LANGUAGES.map(code => ({ value: code, label: t(`lang.${code}`) }))} value={language} onChange={setLanguage} />
      <RadioChipGroup className="prefs-group" label={t('prefs.layout')} options={LAYOUTS.map(code => ({ value: code, label: t(`prefs.layout.${code}`) }))} value={layout} onChange={setLayout} />
      <CheckboxField label={t('prefs.traffic')} checked={traffic} onChange={setTraffic} />
      <CheckboxField label={t('prefs.confirmSale')} checked={confirmSale} onChange={setConfirmSale} />
      <CheckboxField label={t('prefs.showReach')} checked={showReach} onChange={setShowReach} />
      <CheckboxField label={t('prefs.showProductionPreview')} checked={showProductionPreview} onChange={setShowProductionPreview} />
      <CheckboxField label={t('prefs.showTaxBadges')} checked={showTaxBadges} onChange={setShowTaxBadges} />
      <CheckboxField label={t('prefs.alwaysDay')} checked={alwaysDay} onChange={setAlwaysDay} />
      <CheckboxField label={t('prefs.debug')} checked={debug} onChange={setDebug} />
    </section>
  );
}
