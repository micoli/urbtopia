import { useEffect, useState, type ReactNode } from 'react';
import { t } from '../i18n/t';
import { GuideHeader } from './GuideHeader';
import { GuideNav } from './GuideNav';
import { GuideRouteContext } from './guideRouteContext';
import { ReaderSettingsBar } from './reader/ReaderSettingsBar';
import { restoreReaderSettings } from './reader/readerSettingsStore';
import { sectionOf, type GuideRoute } from './routes';
import { SearchDialog } from './search/SearchDialog';
import { followSystemTheme } from './theme';

interface GuideLayoutProps {
  route: GuideRoute;
  children: ReactNode;
}

export function GuideLayout({ route, children }: GuideLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(followSystemTheme, []);

  useEffect(restoreReaderSettings, []);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);

  return (
    <GuideRouteContext value={route}>
    <div className="min-h-screen bg-surface text-ink">
      <GuideHeader route={route} onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
      {searchOpen && <SearchDialog route={route} onClose={() => setSearchOpen(false)} />}
      <div className="mx-auto flex max-w-7xl">
        {menuOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line bg-surface p-4 transition-transform lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:bg-transparent ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-4 flex justify-end lg:hidden">
            <button type="button" className="guide-icon-button" aria-label={t('guide.closeMenu')} onClick={() => setMenuOpen(false)}>
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <GuideNav route={route} />
        </aside>
        <main className="guide-content min-w-0 flex-1 px-4 pt-8 pb-24 sm:px-8 lg:px-12">
          {(sectionOf(route) === 'codex' || sectionOf(route) === 'mechanics') && <ReaderSettingsBar />}
          {children}
        </main>
      </div>
    </div>
    </GuideRouteContext>
  );
}
