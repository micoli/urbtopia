import { architectMessages, type ArchitectMessageKey } from './messages.ts';

// In the game this is `t` of src/i18n; the studio reads the browser language, or `?lang=en|fr`.
const requested = new URLSearchParams(location.search).get('lang');
const language = requested === 'en' || requested === 'fr' ? requested : navigator.language.startsWith('fr') ? 'fr' : 'en';
const messages = architectMessages(language);

export const t = (key: ArchitectMessageKey): string => messages[key];
export { language };
