import { prefsStore } from '../i18n/prefsStore';
import { t } from '../i18n/t';
import { hrefOf, translatedPathOf, type GuideRoute } from './routes';

interface LanguageSwitchProps {
  route: GuideRoute;
}

export function LanguageSwitch({ route }: LanguageSwitchProps) {
  const other = route.language === 'en' ? 'fr' : 'en';
  return (
    <a
      className="guide-chip"
      href={hrefOf(route, translatedPathOf(route, other))}
      hrefLang={other}
      lang={other}
      onClick={() => prefsStore.getState().setLanguage(other)}
    >
      {t('guide.otherLanguage')}
    </a>
  );
}
