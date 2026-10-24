export type GuideTheme = 'light' | 'dark';

export const THEME_KEY = 'urbtopia-guide-theme';

export const currentTheme = (): GuideTheme => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

export function setTheme(theme: GuideTheme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The theme still applies to this visit.
  }
}

export function followSystemTheme(): () => void {
  const query = matchMedia('(prefers-color-scheme: dark)');
  const follow = () => {
    try {
      if (localStorage.getItem(THEME_KEY)) return;
    } catch {
      // Without storage the system theme always applies.
    }
    document.documentElement.dataset.theme = query.matches ? 'dark' : 'light';
  };
  query.addEventListener('change', follow);
  return () => query.removeEventListener('change', follow);
}
